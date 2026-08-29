import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Platform } from 'react-native';

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

/**
 * IMPORTANT: Use your machine's local IP (not localhost) so real devices can reach the backend.
 * `localhost` only works in iOS Simulator. Android Emulator uses `10.0.2.2`.
 * Replace the IP below with your Mac's LAN IP if testing on a physical device.
 */
const BACKEND_URL = Platform.select({
  ios:     'http://192.168.18.39:4000',
  android: 'http://192.168.18.39:4000',
  default: 'http://192.168.18.39:4000',
});

// ─── Module-level state ──────────────────────────────────────────────────────

let activePacket: SosPayload | null = null;
let currentHops = 0;
let simulationInterval: ReturnType<typeof setInterval> | null = null;
const packetLogs: PacketLog[] = [];
let listeners: ((state: any) => void)[] = [];
let peerCount = 0;
let hasInternetAccess = false;

/** Routing mode for the current (or last) SOS. */
let routingMode: RoutingMode = 'idle';

/**
 * Which hop number finally uploaded the packet to the backend
 * (null = not yet uploaded, or uploaded directly so hop is 0).
 */
let uploadedByHop: number | null = null;

// ─── Internet monitoring ─────────────────────────────────────────────────────

// Keep hasInternetAccess updated in real time.
// When internet comes back, flush any queued packets immediately.
NetInfo.addEventListener(state => {
  hasInternetAccess = !!state.isConnected;
  if (hasInternetAccess) {
    flushQueue();
  }
});

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
      const response = await fetch(`${BACKEND_URL}/api/sos`, {
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
            routingMode = 'direct'; // Or keep it ble_mesh but show uploaded by hop 0
            _pushLog(packetLogs, {
              id: activePacket.packetId.substring(0, 12) + '...', // We don't have shortId here easily, but this works
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

// ─── State subscription ───────────────────────────────────────────────────────

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

export const getMeshState = () => ({
  activePacket,
  currentHops,
  packetLogs: [...packetLogs],
  peerCount,
  isRelayActive: !!activePacket,
  isGateway: hasInternetAccess,
  routingMode,
  uploadedByHop,
});

// ─── SOS trigger ─────────────────────────────────────────────────────────────

/**
 * Trigger an SOS signal.
 *
 * Routing decision:
 *   • Internet available → upload immediately (routingMode = 'direct'),
 *     then start BLE simulation so mesh peers can also see the packet.
 *   • No internet → enqueue locally (routingMode = 'ble_mesh'),
 *     start BLE simulation — first simulated peer with internet will upload.
 */
export const sendSos = async (data: Partial<SosPayload>) => {
  // Clear any running simulation from a previous SOS
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }

  // Build a stable short ID for the log display (e.g. "SOS-A3F2-47")
  const shortId = `SOS-${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;

  // Full UUID for the backend (must be valid UUID v4 format)
  const packetId = _uuid();

  const payload: SosPayload = {
    packetId,
    originDeviceId: 'f3a9c2e1b8d04a17',
    latitude:  data.latitude  ?? 27.6869,
    longitude: data.longitude ?? 86.7314,
    battery:   data.battery   ?? 78,
    hopCount: 0,
    reportedAt: new Date().toISOString(),
    note: data.note ?? undefined,
  };

  // Reset state
  activePacket  = payload;
  currentHops   = 0;
  peerCount     = 1;
  uploadedByHop = null;
  packetLogs.length = 0;

  // ── Step 1: log that this device originated the SOS ────────────────────────
  _pushLog(packetLogs, {
    id: shortId,
    origin: 'This Device (Owner SOS)',
    seenFrom: '— (own broadcast)',
    rssi: 'Local',
    status: 'Origin',
  });

  // ── Step 2: decide routing mode ────────────────────────────────────────────
  // Always do a FRESH internet check at send time — the module-level
  // hasInternetAccess variable may be stale if NetInfo event hasn't fired yet.
  let isOnline = hasInternetAccess;
  try {
    const netState = await NetInfo.fetch();
    isOnline = !!netState.isConnected && !!netState.isInternetReachable;
    hasInternetAccess = isOnline; // keep module state in sync
  } catch {
    // If NetInfo.fetch fails, fall back to the cached value
  }

  if (isOnline) {
    // ── DIRECT PATH ──────────────────────────────────────────────────────────
    routingMode = 'direct';
    notifyListeners(); // update UI immediately with mode

    try {
      const res = await fetch(`${BACKEND_URL}/api/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok || res.status === 409) {
        uploadedByHop = 0; // hop 0 = this device
        _pushLog(packetLogs, {
          id: shortId,
          origin: 'This Device',
          seenFrom: 'Internet (Direct)',
          rssi: 'Wi-Fi / Cellular',
          status: 'Direct Upload',
        });
      } else {
        // Server returned an error — log it and fall back to BLE queue
        const errBody = await res.text().catch(() => '');
        console.warn(`[SOS] Direct upload failed: HTTP ${res.status}`, errBody);
        await enqueueSos(payload);
        routingMode = 'ble_mesh';
      }
    } catch (err) {
      // Network error despite NetInfo saying online — enqueue & try BLE
      console.warn('[SOS] Direct upload fetch error:', err);
      await enqueueSos(payload);
      routingMode = 'ble_mesh';
    }
  } else {
    // ── BLE MESH PATH ─────────────────────────────────────────────────────────
    routingMode = 'ble_mesh';
    notifyListeners();
    // Queue locally so it gets uploaded the moment this device gains internet
    await enqueueSos(payload);
  }

  notifyListeners();

  // ── Step 3: BLE simulation loop ────────────────────────────────────────────
  // Runs regardless of routing mode:
  //   • In direct mode  — shows peers relaying as a secondary confirmation
  //   • In BLE mode     — critical path; first internet-connected peer uploads
  _startBleSimulation(payload, shortId);
};

// ─── Cancel SOS ──────────────────────────────────────────────────────────────

export const cancelSos = () => {
  activePacket  = null;
  currentHops   = 0;
  peerCount     = 0;
  uploadedByHop = null;
  routingMode   = 'idle';
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  notifyListeners();
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

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

/**
 * Simulates BLE packet propagation through nearby peers every 3 seconds.
 *
 * Logic per tick:
 *   1. Increment hop counter + peer count
 *   2. Pick a random virtual peer
 *   3. 70% chance it relays (30% dedup skip)
 *   4. If relayed AND peer has internet (40% chance) → peer uploads to backend
 *      - In BLE mesh mode this is the primary upload path
 *      - In direct mode this is a secondary redundant confirmation (409 is fine)
 *   5. Stop after 10 hops
 */
function _startBleSimulation(payload: SosPayload, shortId: string) {
  simulationInterval = setInterval(async () => {
    currentHops += 1;
    peerCount = Math.min(12, peerCount + Math.floor(Math.random() * 3) + 1);

    const peerId   = `Peer Device #${Math.floor(10 + Math.random() * 89)}`;
    const fromId   = `Peer Device #${Math.floor(10 + Math.random() * 89)}`;
    const rssi     = `-${50 + Math.floor(Math.random() * 40)} dBm`;
    const isDuped  = Math.random() > 0.7;
    const hopStatus: PacketLog['status'] = isDuped ? 'Dedup Skip' : 'Relayed';

    _pushLog(packetLogs, {
      id:       shortId,
      origin:   'This Device (Owner SOS)',
      seenFrom: isDuped ? peerId : fromId,
      rssi,
      status:   hopStatus,
    });

    // ── Simulate a peer that has internet uploading the packet ───────────────
    const peerHasInternet = !isDuped && Math.random() > 0.6;
    if (peerHasInternet) {
      const relayPayload: SosPayload = { ...payload, hopCount: currentHops };

      _pushLog(packetLogs, {
        id:       shortId,
        origin:   'This Device (Owner SOS)',
        seenFrom: `${peerId} (Gateway → Internet)`,
        rssi,
        status:   'Uploaded',
      });

      try {
        const res = await fetch(`${BACKEND_URL}/api/sos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(relayPayload),
        });
        // 202 = first upload by this peer; 409 = already uploaded (fine)
        if ((res.ok || res.status === 409) && uploadedByHop === null) {
          uploadedByHop = currentHops;
          // If we were in BLE mesh mode, the packet is now confirmed uploaded
          // Switch mode to show it was delivered via mesh
        }
      } catch {
        // Peer upload failed — mesh continues trying through other peers
      }
    }

    notifyListeners();

    // Stop after 10 hops to avoid running forever
    if (currentHops >= 10) {
      if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
      }
    }
  }, 3000);
}
