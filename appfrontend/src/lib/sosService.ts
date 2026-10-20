import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';
import {
  BleMeshTransport,
  type MeshEvent,
  type MeshState,
  type SosPayload as MeshSosPayload,
  getMeshTransport,
  resetMeshTransport,
  initializeMesh as meshInitializeTransport,
  shutdownMesh as meshShutdownTransport,
} from './bleMeshTransport';

// ─── Interfaces ──────────────────────────────────────────────────────────────

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

export interface PacketLog {
  id: string;
  origin: string;
  seenFrom: string;
  time: string;
  status: 'Relayed' | 'Origin' | 'Dedup Skip' | 'Uploaded' | 'Direct Upload';
  rssi: string;
}

/** How the SOS was / is being routed to the backend. */
export type RoutingMode = 'idle' | 'direct' | 'ble_mesh';

// ─── Constants ───────────────────────────────────────────────────────────────

const QUEUE_KEY = 'sosQueue';

import BACKEND_URL from '@/lib/config';

const BACKEND = BACKEND_URL;

// ─── Module-level state ──────────────────────────────────────────────────────

let meshTransport: BleMeshTransport | null = null;
let activePacket: SosPayload | null = null;
let currentHops = 0;
const packetLogs: PacketLog[] = [];
let listeners: ((state: any) => void)[] = [];
let peerCount = 0;
let hasInternetAccess = false;
let meshInitialized = false;

/** Routing mode for the current (or last) SOS. */
let routingMode: RoutingMode = 'idle';

/**
 * Which hop number finally uploaded the packet to the backend
 * (null = not yet uploaded, or uploaded directly so hop is 0).
 */
let uploadedByHop: number | null = null;

// ─── Internet monitoring ─────────────────────────────────────────────────────

let netInfoUnsubscribe: (() => void) | null = null;

function initNetInfo() {
  if (netInfoUnsubscribe) return;

  netInfoUnsubscribe = NetInfo.addEventListener(state => {
    const wasOffline = !hasInternetAccess;
    hasInternetAccess = !!state.isConnected && !!state.isInternetReachable;

    if (wasOffline && hasInternetAccess) {
      flushQueue();
    }
  });
}

// ─── Offline queue helpers ───────────────────────────────────────────────────

const getQueue = async (): Promise<SosPayload[]> => {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const setQueue = async (q: SosPayload[]) => {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(q));
};

export const enqueueSos = async (payload: SosPayload) => {
  const q = await getQueue();
  q.push(payload);
  await setQueue(q);
};

/**
 * Flush the local offline queue whenever internet becomes available.
 * Packets successfully acknowledged by the backend (202 or 409 dedup) are removed.
 */
export const flushQueue = async () => {
  const q = await getQueue();
  if (!q.length) return;
  const remaining: SosPayload[] = [];
  let stateChanged = false;

  for (const p of q) {
    try {
      const response = await fetch(`${BACKEND}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      // 409 = dedup (already uploaded by a peer) — treat as success, don't retry
      if (!response.ok && response.status !== 409) {
        remaining.push(p);
      } else {
        // Success (200/202 or 409)
        if (activePacket && activePacket.packetId === p.packetId) {
          if (uploadedByHop === null) {
            uploadedByHop = 0; // This device finally uploaded it
            routingMode = 'direct';
            _pushLog(packetLogs, {
              id: activePacket.packetId.substring(0, 12) + '...',
              origin: 'This Device',
              seenFrom: 'Internet (Recovered Connection)',
              rssi: 'Wi-Fi / Cellular',
              status: 'Direct Upload',
            });
            stateChanged = true;
          }
        }
      }
    } catch {
      remaining.push(p);
    }
  }
  await setQueue(remaining);
  if (stateChanged) notifyListeners();
};

// ─── Mesh Event Handler ──────────────────────────────────────────────────────

function meshEventHandler(event: MeshEvent): void {
  switch (event.type) {
    case 'peer_found':
      peerCount = (meshTransport?.state.peerCount ?? 0) + 1;
      break;
    case 'peer_lost':
      peerCount = Math.max(0, (meshTransport?.state.peerCount ?? 1) - 1);
      break;
    case 'packet_received': {
      // Incoming relayed packet from another phone
      const { packet, fromPeerId, rssi, hopCount } = event;
      _pushLog(packetLogs, {
        id: packet.packetId.slice(0, 8) + '...',
        origin: `Device ${packet.originDeviceId.slice(0, 4)}`,
        seenFrom: `Peer ${fromPeerId.slice(0, 8)} (${rssi} dBm)`,
        rssi: `${rssi} dBm`,
        status: 'Relayed',
      });

      // If this is our own packet being relayed back, update hop count
      if (activePacket && activePacket.packetId === packet.packetId) {
        currentHops = hopCount;
        uploadedByHop = hopCount; // mark that it reached the mesh
        routingMode = 'ble_mesh';
      }
      // If we have internet, try to upload immediately
      if (hasInternetAccess && meshTransport) {
        meshTransport.flushToBackend(packet, BACKEND);
      }
      break;
    }
    case 'packet_relayed': {
      const { packet, toPeerId, hopCount } = event;
      _pushLog(packetLogs, {
        id: packet.packetId.slice(0, 8) + '...',
        origin: 'This Device (Owner SOS)',
        seenFrom: `Peer ${toPeerId.slice(0, 8)} → Relayed`,
        rssi: 'BLE',
        status: 'Relayed',
      });
      if (activePacket && activePacket.packetId === packet.packetId) {
        currentHops = hopCount;
      }
      break;
    }
    case 'packet_uploaded': {
      const { packet, hopCount } = event;
      if (activePacket && activePacket.packetId === packet.packetId) {
        if (uploadedByHop === null) {
          uploadedByHop = hopCount;
          _pushLog(packetLogs, {
            id: packet.packetId.slice(0, 8) + '...',
            origin: 'This Device',
            seenFrom: `Internet (via Hop ${hopCount})`,
            rssi: 'Wi-Fi / Cellular',
            status: 'Uploaded',
          });
          routingMode = hopCount === 0 ? 'direct' : 'ble_mesh';
        }
      }
      break;
    }
    case 'state_changed':
      // Mesh state updated, will be reflected in getMeshState()
      break;
    case 'error':
      console.warn('[BLE Mesh] Error:', event.message);
      break;
  }
  notifyListeners();
}

// ─── State subscription ──────────────────────────────────────────────────────

export const subscribeToMesh = (callback: (state: any) => void) => {
  listeners.push(callback);
  callback(getMeshState());
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
};

const notifyListeners = () => {
  const state = getMeshState();
  listeners.forEach(l => l(state));
};

export const getMeshState = () => {
  const mesh = meshTransport?.state;
  return {
    activePacket,
    currentHops,
    packetLogs: [...packetLogs],
    peerCount,
    isRelayActive: !!activePacket,
    isGateway: hasInternetAccess,
    routingMode,
    uploadedByHop,
    isScanning: mesh?.isScanning ?? false,
    isAdvertising: mesh?.isAdvertising ?? false,
    hasPermission: mesh?.hasPermission ?? false,
    isBluetoothOn: mesh?.isBluetoothOn ?? false,
  };
};

// ─── Mesh Transport Initialization ──────────────────────────────────────────

/** Initialize the BLE mesh transport. Call once on app startup. */
export const initializeMesh = async (): Promise<boolean> => {
  if (meshInitialized) return true;

  try {
    initNetInfo();
    meshTransport = getMeshTransport();
    // Subscribe to mesh events
    meshTransport.subscribe(meshEventHandler);
    const success = await meshInitializeTransport();
    meshInitialized = success;
    return success;
  } catch (e) {
    console.error('[SOS] Mesh initialization failed:', e);
    return false;
  }
};

/** Shutdown the BLE mesh transport. */
export const shutdownMesh = async (): Promise<void> => {
  if (meshTransport) {
    await meshTransport.shutdown();
    resetMeshTransport();
    meshTransport = null;
    meshInitialized = false;
  }
};

// ─── SOS trigger ─────────────────────────────────────────────────────────────

/**
 * Trigger an SOS signal.
 *
 * Routing decision:
 *   • Internet available → upload immediately (routingMode = 'direct'),
 *     then start BLE mesh so peers can also relay.
 *   • No internet → send into BLE mesh (routingMode = 'ble_mesh'),
 *     first internet-connected peer will upload to backend.
 */
export const sendSos = async (data: Partial<SosPayload>) => {
  // Clear any running state from a previous SOS
  if (meshTransport) {
    // mesh handles its own cleanup
  }

  // Build a stable short ID for the log display (e.g. "SOS-A3F2-47")
  const shortId = `SOS-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

  // Full UUID for the backend (must be valid UUID v4 format)
  const packetId = _uuid();

  const payload: SosPayload = {
    packetId,
    originDeviceId: meshTransport?.deviceId ?? 'f3a9c2e1b8d04a17',
    latitude: data.latitude ?? 27.6869,
    longitude: data.longitude ?? 86.7314,
    battery: data.battery ?? 78,
    hopCount: 0,
    reportedAt: new Date().toISOString(),
    note: data.note ?? undefined,
    // optional profile fields
    name: (data as any).name,
    address: (data as any).address,
    email: (data as any).email,
    phone: (data as any).phone,
    bloodGroup: (data as any).bloodGroup,
  };

  // Reset state
  activePacket = payload;
  currentHops = 0;
  uploadedByHop = null;
  packetLogs.length = 0;
  peerCount = meshTransport?.state.peerCount ?? 0;

  // Step 1: log that this device originated the SOS
  _pushLog(packetLogs, {
    id: shortId,
    origin: 'This Device (Owner SOS)',
    seenFrom: '— (own broadcast)',
    rssi: 'Local',
    status: 'Origin',
  });

  // Step 2: decide routing mode - fresh internet check at send time
  let isOnline = hasInternetAccess;
  try {
    const netState = await NetInfo.fetch();
    isOnline = !!netState.isConnected && !!netState.isInternetReachable;
    hasInternetAccess = isOnline;
  } catch {
    // fall back to cached value
  }

  if (isOnline) {
    // DIRECT PATH - upload immediately
    routingMode = 'direct';
    notifyListeners();

    try {
      const res = await fetch(`${BACKEND}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 409) {
        uploadedByHop = 0;
        _pushLog(packetLogs, {
          id: shortId,
          origin: 'This Device',
          seenFrom: 'Internet (Direct)',
          rssi: 'Wi-Fi / Cellular',
          status: 'Direct Upload',
        });
      } else {
        const errBody = await res.text().catch(() => '');
        console.warn(`[SOS] Direct upload failed: HTTP ${res.status}`, errBody);
        await enqueueSos(payload);
        routingMode = 'ble_mesh';
      }
    } catch (err) {
      console.warn('[SOS] Direct upload fetch error:', err);
      await enqueueSos(payload);
      routingMode = 'ble_mesh';
    }
  } else {
    // BLE MESH PATH - send into mesh
    routingMode = 'ble_mesh';
    notifyListeners();
    await enqueueSos(payload);
  }

  notifyListeners();

  // Step 3: Send into real BLE mesh (if initialized)
  if (meshTransport && meshInitialized) {
    try {
      await meshTransport.sendSos(payload);
    } catch (e) {
      console.error('[SOS] Failed to send into mesh:', e);
    }
  } else {
    // Fallback: log warning if mesh not ready
    console.warn('[SOS] Mesh not initialized, packet queued only');
    _pushLog(packetLogs, {
      id: shortId,
      origin: 'System',
      seenFrom: 'Mesh not ready',
      rssi: '—',
      status: 'Dedup Skip',
    });
  }
};

// ─── Cancel SOS ──────────────────────────────────────────────────────────────

export const cancelSos = () => {
  activePacket = null;
  currentHops = 0;
  peerCount = 0;
  uploadedByHop = null;
  routingMode = 'idle';
  packetLogs.length = 0;
  notifyListeners();
};

// ─── Internal helpers ────────────────────────────────────────────────────────

function _uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function _pushLog(
  logs: PacketLog[],
  entry: Omit<PacketLog, 'time'> & { time?: string },
) {
  logs.unshift({
    ...entry,
    time: entry.time ?? new Date().toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }),
  });
}