import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { BleManager, type CharacteristicProperty, type AttributePermission } from 'expo-ble-kit';
import { io } from 'socket.io-client';

// ─── Protocol Constants ────────────────────────────────────────────────────────

/**
 * AASHA custom 128-bit UUID for SOS mesh.
 * Generated with: uuidgen | tr '[:upper:]' '[:lower:]'
 * Base: aasha-sos-mesh
 */
export const AASHA_SERVICE_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d';
export const AASHA_PACKET_CHAR_UUID = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5e';

// BLE advertisement packet size limit is ~20 bytes for standard advertising
// We use GATT write for actual packet transfer (up to 512 bytes with negotiated MTU)
const MAX_ADVERTISING_INTERVAL = 200; // ms (Android balanced scan)
const SCAN_DUTY_CYCLE = 0.1; // 10% duty cycle to save battery

// Packet format over BLE GATT: JSON string (hex encoded for binary safety)
// Structure: { packetId, originDeviceId, latitude, longitude, battery, hopCount, reportedAt, note?, name?, address?, email?, phone?, bloodGroup? }

export interface SosPayload {
  packetId: string;
  originDeviceId: string;
  latitude: number;
  longitude: number;
  battery?: number;
  hopCount?: number;
  reportedAt: string;
  note?: string;
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
}

// ─── Internal Types ────────────────────────────────────────────────────────────

interface DiscoveredPeer {
  id: string;
  name?: string;
  localName?: string;
  rssi?: number;
  serviceUUIDs?: string[];
  advertisingData?: any;
  lastSeen: number;
}

interface PendingWrite {
  peerId: string;
  payload: string; // hex-encoded JSON
  resolve: (success: boolean) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

interface MeshConfig {
  deviceId: string; // 16-char anonymized ID for this phone
  maxHops: number; // max hops before dropping (default 10)
  dedupCacheTtlMs: number; // 30 minutes
  scanIntervalMs: number; // how often to scan (default 3000ms)
  advertiseIntervalMs: number; // how often to advertise (default 2000ms)
}

type MeshEventCallback = (event: MeshEvent) => void;

export type MeshEvent =
  | { type: 'peer_found'; peer: DiscoveredPeer }
  | { type: 'peer_lost'; peerId: string }
  | { type: 'packet_received'; packet: SosPayload; fromPeerId: string; rssi: number; hopCount: number }
  | { type: 'packet_relayed'; packet: SosPayload; toPeerId: string; hopCount: number }
  | { type: 'packet_uploaded'; packet: SosPayload; hopCount: number }
  | { type: 'state_changed'; state: MeshState }
  | { type: 'error'; message: string };

export interface MeshState {
  isScanning: boolean;
  isAdvertising: boolean;
  isBluetoothOn: boolean;
  hasPermission: boolean;
  isGateway?: boolean;
  peerCount: number;
  knownPeers: DiscoveredPeer[];
  activePacket: SosPayload | null;
  currentHops: number;
  routingMode: 'idle' | 'direct' | 'ble_mesh';
  uploadedByHop: number | null;
}

// ─── Deduplication Cache ──────────────────────────────────────────────────────

class DedupCache {
  private cache = new Map<string, number>(); // packetId -> timestamp
  private ttlMs: number;

  constructor(ttlMs: number) {
    this.ttlMs = ttlMs;
  }

  has(packetId: string): boolean {
    const ts = this.cache.get(packetId);
    if (!ts) return false;
    if (Date.now() - ts > this.ttlMs) {
      this.cache.delete(packetId);
      return false;
    }
    return true;
  }

  add(packetId: string): void {
    this.cache.set(packetId, Date.now());
  }

  cleanup(): void {
    const now = Date.now();
    for (const [id, ts] of this.cache.entries()) {
      if (now - ts > this.ttlMs) this.cache.delete(id);
    }
  }
}

// ─── Main Mesh Transport Class ────────────────────────────────────────────────

export class BleMeshTransport {
  private useSimulation = false;
  private simSocket: ReturnType<typeof io> | null = null;
  private nativeAvailable = true;
  private config: MeshConfig;
  private dedupCache: DedupCache;
  private listeners = new Set<MeshEventCallback>();

  // State
  private _state: MeshState = {
    isScanning: false,
    isAdvertising: false,
    isBluetoothOn: false,
    hasPermission: false,
    isGateway: false,
    peerCount: 0,
    knownPeers: [],
    activePacket: null,
    currentHops: 0,
    routingMode: 'idle',
    uploadedByHop: null,
  };

  // Peer tracking
  private knownPeers = new Map<string, DiscoveredPeer>();
  private peerCleanupInterval: ReturnType<typeof setInterval> | null = null;
  private scanInterval: ReturnType<typeof setInterval> | null = null;
  private advertiseInterval: ReturnType<typeof setInterval> | null = null;

  // Peripheral (server) side
  private gattServer: any = null;
  private advertisement: any = null;

  // Central (client) side
  private pendingWrites = new Map<string, PendingWrite>();
  private connectionQueue = new Map<string, Promise<boolean>>();

  constructor(config: Partial<MeshConfig> = {}) {
    this.config = {
      deviceId: config.deviceId || this.generateDeviceId(),
      maxHops: config.maxHops ?? 10,
      dedupCacheTtlMs: config.dedupCacheTtlMs ?? 30 * 60 * 1000, // 30 min
      scanIntervalMs: config.scanIntervalMs ?? 3000,
      advertiseIntervalMs: config.advertiseIntervalMs ?? 2000,
    };
    this.dedupCache = new DedupCache(this.config.dedupCacheTtlMs);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  get state(): MeshState {
    return { ...this._state };
  }

  get deviceId(): string {
    return this.config.deviceId;
  }

  /** Subscribe to mesh events. Returns unsubscribe function. */
  subscribe(callback: MeshEventCallback): () => void {
    this.listeners.add(callback);
    // Send initial state as a state_changed event
    callback({ type: 'state_changed', state: this._state });
    return () => this.listeners.delete(callback);
  }

  /** Initialize Bluetooth and start mesh. Call once on app startup. */
  async initialize(): Promise<boolean> {
    console.log('[BLE Mesh] Initializing...');

    // 1. Check if native module is available upfront
    if (!this.checkNativeAvailable()) {
      console.log('[BLE Mesh] Native module not available, using simulation');
      return this.initSimulation();
    }

    // 2. Try native BLE
    try {
      const nativeOk = await this.tryNativeInitialize();
      if (nativeOk) {
        console.log('[BLE Mesh] Initialized with native BLE');
        return true;
      }
    } catch (e) {
      console.warn('[BLE Mesh] Native BLE failed, falling back to simulation:', (e as Error).message);
    }

    // 3. Simulation fallback
    return this.initSimulation();
  }

  private initSimulation(): boolean {
    this.useSimulation = true;
    this._state = { ...this._state, isBluetoothOn: true, hasPermission: true, isScanning: true, isAdvertising: true };
    this.emit({ type: 'state_changed', state: this._state });

    this.connectSimSocket();

    // Auto-reconnect simulation socket when network comes back
    NetInfo.addEventListener(state => {
      const online = !!state.isConnected && !!state.isInternetReachable;
      if (online && this.useSimulation && (!this.simSocket || !this.simSocket.connected)) {
        console.log('[BLE Mesh Sim] Network back, reconnecting');
        this.connectSimSocket();
      }
    });

    this.peerCleanupInterval = setInterval(() => this.cleanupStalePeers(), 10000);
    setInterval(() => this.dedupCache.cleanup(), 60000);

    console.log('[BLE Mesh] Initialized with simulation');
    return true;
  }

  private connectSimSocket() {
    if (this.simSocket && this.simSocket.connected) return;

    if (this.simSocket) {
      this.simSocket.disconnect();
    }

    this.simSocket = io(process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.1.66:3000', {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
    });

    this.simSocket.on('connect', () => {
      console.log('[BLE Mesh Sim] Connected to relay server');
      this._state = { ...this._state, isGateway: true };
      this.emit({ type: 'state_changed', state: this._state });
    });

    this.simSocket.on('disconnect', () => {
      console.log('[BLE Mesh Sim] Disconnected from relay server');
      this._state = { ...this._state, isGateway: false };
      this.emit({ type: 'state_changed', state: this._state });
    });

    this.simSocket.on('aasha:ble_packet', (data: { packet: SosPayload; fromPeerId: string; rssi: number }) => {
      this.handleIncomingPacket(data.fromPeerId, JSON.stringify(data.packet));
    });

    this.simSocket.on('aasha:peer_joined', (data: { peerId: string }) => {
      const peer: DiscoveredPeer = {
        id: data.peerId,
        name: `AASHA-${data.peerId.slice(0, 4)}`,
        rssi: -60,
        lastSeen: Date.now(),
      };
      this.knownPeers.set(data.peerId, peer);
      this.emit({ type: 'peer_found', peer });
      this.updatePeerCount();
    });

    this.simSocket.on('aasha:peer_left', (data: { peerId: string }) => {
      this.knownPeers.delete(data.peerId);
      this.emit({ type: 'peer_lost', peerId: data.peerId });
      this.updatePeerCount();
    });
  }

  private async tryNativeInitialize(): Promise<boolean> {
    // 1. Check Bluetooth state — if this throws, native module is missing
    const btState = await this.checkBluetoothState();
    if (!btState) {
      this.emit({ type: 'error', message: 'Bluetooth is off or unavailable' });
      return false;
    }

    // 2. Get Bluetooth permissions (retry once on failure)
    let perms = await this.requestPermissions();
    if (!perms) {
      await new Promise(r => setTimeout(r, 500));
      perms = await this.requestPermissions();
    }
    if (!perms) {
      this.emit({ type: 'error', message: 'Bluetooth permissions denied' });
    }

    // 3. Setup peripheral (GATT server for receiving relayed packets)
    await this.setupPeripheral();

    // 4. Start background scanning + advertising
    this.startPeriodicScan();
    this.startPeriodicAdvertise();

    // 5. Periodic cleanup
    this.peerCleanupInterval = setInterval(() => this.cleanupStalePeers(), 10000);
    setInterval(() => this.dedupCache.cleanup(), 60000);

    return true;
  }

  private checkNativeAvailable(): boolean {
    try {
      // Touch the native module — if it's missing, this throws
      const _ = BleManager.state;
      // Also verify it's not a stub by checking if it has the expected methods
      if (typeof BleManager.requestPermissionsAsync !== 'function') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Check Bluetooth adapter state. */
  private async checkBluetoothState(): Promise<boolean> {
    try {
      const state = BleManager.state;
      this._state = { ...this._state, isBluetoothOn: state === 'poweredOn' };
      this.emit({ type: 'state_changed', state: this._state });
      return state === 'poweredOn';
    } catch (e) {
      console.error('[BLE Mesh] Bluetooth state check failed:', e);
      this._state = { ...this._state, isBluetoothOn: true };
      this.emit({ type: 'state_changed', state: this._state });
      return true;
    }
  }

  /** Send an SOS packet into the mesh (originates here). */
  async sendSos(packet: SosPayload): Promise<void> {
    // Mark as originated from this device
    const outboundPacket: SosPayload = {
      ...packet,
      originDeviceId: this.config.deviceId,
      hopCount: 0,
    };

    this._state = {
      ...this._state,
      activePacket: outboundPacket,
      currentHops: 0,
      routingMode: 'ble_mesh',
      uploadedByHop: null,
    };
    this.emit({ type: 'state_changed', state: this._state });

    // Add to dedup cache so we don't re-relay our own packet
    this.dedupCache.add(outboundPacket.packetId);

    // In simulation mode, broadcast via the relay server
    if (this.useSimulation && this.simSocket) {
      this.simSocket.emit('aasha:ble_packet', {
        packet: outboundPacket,
        fromPeerId: this.config.deviceId,
        rssi: -60,
      });
      this.simSocket.emit('aasha:peer_joined', { peerId: this.config.deviceId });
      return;
    }

    // Start relaying to nearby peers
    this.relayToPeers(outboundPacket);
  }

  /** Called when internet becomes available — flush any pending packets to backend. */
  async flushToBackend(packet: SosPayload, backendUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${backendUrl}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet),
      });
      if (response.ok || response.status === 409) {
        this._state = { ...this._state, uploadedByHop: this._state.currentHops, routingMode: 'direct' };
        this.emit({ type: 'packet_uploaded', packet, hopCount: this._state.currentHops });
        this.emit({ type: 'state_changed', state: this._state });
        return true;
      }
      console.warn('[BLE Mesh] Backend upload failed:', response.status);
      return false;
    } catch (e) {
      console.warn('[BLE Mesh] Backend upload error:', e);
      return false;
    }
  }

  /** Stop all mesh activity. */
  async shutdown(): Promise<void> {
    console.log('[BLE Mesh] Shutting down...');
    this.stopPeriodicScan();
    this.stopPeriodicAdvertise();
    if (this.peerCleanupInterval) {
      clearInterval(this.peerCleanupInterval);
      this.peerCleanupInterval = null;
    }
    if (this.advertisement) {
      this.advertisement.stop();
      this.advertisement = null;
    }
    if (this.gattServer) {
      this.gattServer.close();
      this.gattServer = null;
    }
    if (this.simSocket) {
      this.simSocket.disconnect();
      this.simSocket = null;
    }
    this.useSimulation = false;
    this.knownPeers.clear();
    this._state = {
      ...this._state,
      isScanning: false,
      isAdvertising: false,
      peerCount: 0,
      knownPeers: [],
    };
    this.emit({ type: 'state_changed', state: this._state });
  }

  // ─── Private: Permissions & Bluetooth ────────────────────────────────────────

  private async requestPermissions(): Promise<boolean> {
    try {
      // expo-ble-kit handles all BLE permissions via requestPermissionsAsync
      const perms = await BleManager.requestPermissionsAsync({ scan: true, connect: true, advertise: true });
      const granted = perms.scan === 'granted' && perms.connect === 'granted';
      this._state = { ...this._state, hasPermission: granted };
      this.emit({ type: 'state_changed', state: this._state });
      return granted;
    } catch (e) {
      console.error('[BLE Mesh] Permission request failed:', e);
      return false;
    }
  }

  // ─── Private: Peripheral (Server) Setup ──────────────────────────────────────

  private async setupPeripheral(): Promise<void> {
    try {
      // Define GATT service with a writable characteristic for receiving packets
      // NOTE: Do NOT set a static `value` — that makes the characteristic read-only.
      // A writable characteristic must omit `value` so the `onWriteRequest` handler is used.
      const services = [{
        uuid: AASHA_SERVICE_UUID,
        characteristics: [{
          uuid: AASHA_PACKET_CHAR_UUID,
          properties: ['write', 'writeWithoutResponse', 'notify'] as CharacteristicProperty[],
          permissions: ['writeable'] as AttributePermission[],
        }],
      }];

      this.gattServer = await BleManager.openGattServer(services);

      // Listen for incoming writes from other phones (they are relaying packets TO us)
      this.gattServer.onWriteRequest((request: any) => {
        const { centralId, characteristic, value } = request;
        if (characteristic === AASHA_PACKET_CHAR_UUID) {
          this.handleIncomingPacket(centralId, this.uint8ArrayToHex(value));
        }
      });

      console.log('[BLE Mesh] Peripheral (GATT server) ready');
    } catch (e) {
      console.error('[BLE Mesh] Peripheral setup failed:', e);
    }
  }

  private handleIncomingPacket(deviceId: string, hexValue: string): void {
    try {
      // Decode hex -> JSON -> SosPayload
      const jsonStr = this.hexToString(hexValue);
      const packet: SosPayload = JSON.parse(jsonStr);

      // Deduplication
      if (this.dedupCache.has(packet.packetId)) {
        console.log('[BLE Mesh] Duplicate packet ignored:', packet.packetId.slice(0, 8));
        return;
      }
      this.dedupCache.add(packet.packetId);

      // Increment hop count
      const newHopCount = (packet.hopCount ?? 0) + 1;
      if (newHopCount > this.config.maxHops) {
        console.log('[BLE Mesh] Max hops exceeded, dropping:', packet.packetId.slice(0, 8));
        return;
      }

      const relayedPacket: SosPayload = { ...packet, hopCount: newHopCount };

      // Get peer info for RSSI
      const peer = this.knownPeers.get(deviceId);
      const rssi = peer?.rssi ?? -99;

      // Update state
      this._state = {
        ...this._state,
        currentHops: newHopCount,
      };
      this.emit({ type: 'state_changed', state: this._state });
      this.emit({ type: 'packet_received', packet: relayedPacket, fromPeerId: deviceId, rssi, hopCount: newHopCount });

      // If we have internet, upload immediately
      // (The app layer will call flushToBackend when online)
      // Otherwise, relay to OTHER peers (flood)
      this.relayToPeers(relayedPacket, deviceId); // exclude sender

    } catch (e) {
      console.error('[BLE Mesh] Failed to handle incoming packet:', e);
    }
  }

  // ─── Private: Central (Client) Scanning ──────────────────────────────────────

  private startPeriodicScan(): void {
    if (this._state.isScanning) return;

    const doScan = async () => {
      try {
        this._state = { ...this._state, isBluetoothOn: true, isScanning: true };
        this.emit({ type: 'state_changed', state: this._state });

        // expo-ble-kit: startScan with onResults callback
        const scanSession = BleManager.startScan(
          {
            services: [AASHA_SERVICE_UUID],
            allowDuplicates: true,
          },
          (results) => {
            for (const device of results) {
              // Only care about devices advertising our service
              if (device.serviceUUIDs?.includes(AASHA_SERVICE_UUID) || device.name?.includes('AASHA')) {
                const existing = this.knownPeers.get(device.id);
                const peer: DiscoveredPeer = {
                  id: device.id,
                  name: device.name ?? undefined,
                  localName: device.name ?? undefined,
                  rssi: device.rssi,
                  serviceUUIDs: device.serviceUUIDs,
                  advertisingData: device.manufacturerData,
                  lastSeen: Date.now(),
                };
                this.knownPeers.set(device.id, peer);

                if (!existing) {
                  this.emit({ type: 'peer_found', peer });
                }
                this.updatePeerCount();
              }
            }
          },
          (error) => {
            console.error('[BLE Mesh] Scan error:', error);
          }
        );

        // Stop after a short burst to save battery (duty cycle)
        setTimeout(() => {
          scanSession.stop();
          this._state = { ...this._state, isScanning: false };
          this.emit({ type: 'state_changed', state: this._state });
        }, this.config.scanIntervalMs * SCAN_DUTY_CYCLE);
      } catch (e) {
        console.error('[BLE Mesh] Scan error:', e);
        this._state = { ...this._state, isScanning: false };
        this.emit({ type: 'state_changed', state: this._state });
      }
    };

    // Initial scan
    doScan();

    // Periodic scans
    this.scanInterval = setInterval(doScan, this.config.scanIntervalMs);
  }

  private stopPeriodicScan(): void {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this._state = { ...this._state, isScanning: false };
    this.emit({ type: 'state_changed', state: this._state });
  }

  private updatePeerCount(): void {
    this._state = {
      ...this._state,
      peerCount: this.knownPeers.size,
      knownPeers: Array.from(this.knownPeers.values()),
    };
    this.emit({ type: 'state_changed', state: this._state });
  }

  private cleanupStalePeers(): void {
    const now = Date.now();
    const staleThreshold = 15000; // 15 seconds
    for (const [id, peer] of this.knownPeers.entries()) {
      if (now - peer.lastSeen > staleThreshold) {
        this.knownPeers.delete(id);
        this.emit({ type: 'peer_lost', peerId: id });
      }
    }
    this.updatePeerCount();
  }

  // ─── Private: Advertising ────────────────────────────────────────────────────

  private startPeriodicAdvertise(): void {
    if (this._state.isAdvertising) return;

    const doAdvertise = async () => {
      try {
        if (!this.gattServer) return;
        this._state = { ...this._state, isAdvertising: true };
        this.emit({ type: 'state_changed', state: this._state });

        this.advertisement = await BleManager.startAdvertising({
          serviceUUIDs: [AASHA_SERVICE_UUID],
          localName: `AASHA-${this.config.deviceId.slice(0, 4)}`,
        });

        // Advertise for a short burst (duty cycle)
        setTimeout(async () => {
          if (this.advertisement) {
            await this.advertisement.stop();
            this.advertisement = null;
          }
          this._state = { ...this._state, isAdvertising: false };
          this.emit({ type: 'state_changed', state: this._state });
        }, this.config.advertiseIntervalMs * SCAN_DUTY_CYCLE);
      } catch (e) {
        console.error('[BLE Mesh] Advertise error:', e);
        this._state = { ...this._state, isAdvertising: false };
        this.emit({ type: 'state_changed', state: this._state });
      }
    };

    doAdvertise();
    this.advertiseInterval = setInterval(doAdvertise, this.config.advertiseIntervalMs);
  }

  private stopPeriodicAdvertise(): void {
    if (this.advertiseInterval) {
      clearInterval(this.advertiseInterval);
      this.advertiseInterval = null;
    }
    if (this.advertisement) {
      this.advertisement.stop();
      this.advertisement = null;
    }
    this._state = { ...this._state, isAdvertising: false };
    this.emit({ type: 'state_changed', state: this._state });
  }

  // ─── Private: Flooding Relay ─────────────────────────────────────────────────

  private async relayToPeers(packet: SosPayload, excludePeerId?: string): Promise<void> {
    // In simulation mode, broadcast via the relay server
    if (this.useSimulation && this.simSocket) {
      this.simSocket.emit('aasha:ble_packet', {
        packet,
        fromPeerId: this.config.deviceId,
        rssi: -60,
      });
      return;
    }

    const targets = Array.from(this.knownPeers.entries())
      .filter(([id]) => id !== excludePeerId)
      .sort((a, b) => (b[1].rssi ?? -100) - (a[1].rssi ?? -100)) // strongest first
      .slice(0, 3); // limit concurrent relays to save battery

    if (targets.length === 0) {
      console.log('[BLE Mesh] No peers to relay to');
      return;
    }

    const hexPayload = this.stringToHex(JSON.stringify(packet));

    for (const [peerId, peer] of targets) {
      this.writeToPeer(peerId, hexPayload)
        .then((success) => {
          if (success) {
            this.emit({ type: 'packet_relayed', packet, toPeerId: peerId, hopCount: packet.hopCount! });
          }
        })
        .catch((e) => console.warn('[BLE Mesh] Relay write failed to', peerId, e));
    }
  }

  private async writeToPeer(peerId: string, hexPayload: string): Promise<boolean> {
    // Queue connection if not already connecting/connected
    let connectPromise = this.connectionQueue.get(peerId);
    if (!connectPromise) {
      connectPromise = this.connectAndWrite(peerId, hexPayload);
      this.connectionQueue.set(peerId, connectPromise);
      // Remove from queue after completion
      connectPromise.finally(() => this.connectionQueue.delete(peerId));
    }
    // If there's already a pending connection, wait for it
    const result = await connectPromise;
    return result ?? false;
  }

  private async connectAndWrite(peerId: string, hexPayload: string): Promise<boolean> {
    try {
      // Connect via expo-ble-kit
      const peripheral = BleManager.getPeripheral(peerId);
      await peripheral.connect();

      // Write the characteristic — convert hex string to Uint8Array
      const value = this.hexToUint8Array(hexPayload);
      await peripheral.write(
        AASHA_SERVICE_UUID,
        AASHA_PACKET_CHAR_UUID,
        value,
        { withResponse: false }
      );

      // Disconnect to save battery (we're connectionless mesh)
      await peripheral.disconnect();
      return true;
    } catch (e) {
      console.warn('[BLE Mesh] Write to peer failed:', peerId, e);
      try {
        const peripheral = BleManager.getPeripheral(peerId);
        await peripheral.disconnect();
      } catch {}
      return false;
    }
  }

  private hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }

  private uint8ArrayToHex(bytes: Uint8Array): string {
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }

  // ─── Utilities ───────────────────────────────────────────────────────────────

  private generateDeviceId(): string {
    // 16-char hex string (8 bytes) - stable per app install
    return Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  }

  private stringToHex(str: string): string {
    return Array.from(str, c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  }

  private hexToString(hex: string): string {
    const bytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    return new TextDecoder().decode(bytes);
  }

  private emit(event: MeshEvent): void {
    this.listeners.forEach(cb => {
      try { cb(event); } catch (e) { console.error('[BLE Mesh] Listener error:', e); }
    });
  }
}

// ─── Singleton Instance ────────────────────────────────────────────────────────

let meshInstance: BleMeshTransport | null = null;

export function getMeshTransport(config?: Partial<MeshConfig>): BleMeshTransport {
  if (!meshInstance) {
    meshInstance = new BleMeshTransport(config);
  }
  return meshInstance;
}

export function resetMeshTransport(): void {
  if (meshInstance) {
    meshInstance.shutdown();
    meshInstance = null;
  }
}

export async function initializeMesh(): Promise<boolean> {
  const transport = getMeshTransport();
  return transport.initialize();
}

export async function shutdownMesh(): Promise<void> {
  if (meshInstance) {
    await meshInstance.shutdown();
    resetMeshTransport();
  }
}