# BLE Mesh SOS — BLE Protocol Spec

Exact byte-level spec for the packet that travels over the radio. Binary packing bugs are silent and hard to debug, so this doc exists to remove all ambiguity before code gets generated.

---

## 1. Byte layout (47 bytes total)

| Offset | Field | Bytes | Type | Notes |
|---|---|---|---|---|
| 0–15 | `packetId` | 16 | raw UUID bytes | Not the 36-char string form |
| 16–23 | `originDeviceId` | 8 | bytes | Truncated SHA-256 hash of a stable device identifier |
| 24–27 | `latitude` | 4 | float32, little-endian | |
| 28–31 | `longitude` | 4 | float32, little-endian | |
| 32–35 | `timestamp` | 4 | uint32, little-endian | Unix seconds |
| 36 | `hopCount` | 1 | uint8 | 0 at origin, incremented per relay |
| 37 | `ttl` | 1 | uint8 | Max hops allowed, default 10 (see `02-Constants.md`) |
| 38 | `battery` | 1 | uint8 | 0–100 |
| 39–46 | `signature` | 8 | bytes | Truncated HMAC-SHA256 over bytes 0–38 |

**Total: 47 bytes.**

---

## 2. TypeScript encode/decode reference implementation

```ts
// mobile-app/src/ble/codec.ts

import { Buffer } from "buffer";

export interface SosPacket {
  packetId: string;        // UUID string, e.g. "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  originDeviceId: string;  // hex string, 16 chars (8 bytes)
  latitude: number;
  longitude: number;
  timestamp: number;       // unix seconds
  hopCount: number;
  ttl: number;
  battery: number;
  signature: string;       // hex string, 16 chars (8 bytes)
}

const PACKET_SIZE = 47;

export function encodePacket(packet: SosPacket): Buffer {
  const buf = Buffer.alloc(PACKET_SIZE);

  // packetId: strip dashes, parse as hex -> 16 bytes
  const idHex = packet.packetId.replace(/-/g, "");
  Buffer.from(idHex, "hex").copy(buf, 0);

  // originDeviceId: 8 bytes from hex string
  Buffer.from(packet.originDeviceId, "hex").copy(buf, 16);

  buf.writeFloatLE(packet.latitude, 24);
  buf.writeFloatLE(packet.longitude, 28);
  buf.writeUInt32LE(packet.timestamp, 32);
  buf.writeUInt8(packet.hopCount, 36);
  buf.writeUInt8(packet.ttl, 37);
  buf.writeUInt8(packet.battery, 38);

  // signature: 8 bytes from hex string
  Buffer.from(packet.signature, "hex").copy(buf, 39);

  return buf;
}

export function decodePacket(buf: Buffer): SosPacket {
  if (buf.length !== PACKET_SIZE) {
    throw new Error(`Invalid packet size: expected ${PACKET_SIZE}, got ${buf.length}`);
  }

  const idBytes = buf.subarray(0, 16).toString("hex");
  const packetId = [
    idBytes.slice(0, 8),
    idBytes.slice(8, 12),
    idBytes.slice(12, 16),
    idBytes.slice(16, 20),
    idBytes.slice(20, 32),
  ].join("-");

  return {
    packetId,
    originDeviceId: buf.subarray(16, 24).toString("hex"),
    latitude: buf.readFloatLE(24),
    longitude: buf.readFloatLE(28),
    timestamp: buf.readUInt32LE(32),
    hopCount: buf.readUInt8(36),
    ttl: buf.readUInt8(37),
    battery: buf.readUInt8(38),
    signature: buf.subarray(39, 47).toString("hex"),
  };
}
```

---

## 3. Worked example

**Input packet:**
```json
{
  "packetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "originDeviceId": "f3a9c2e1b8d04a17",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "timestamp": 1798450500,
  "hopCount": 0,
  "ttl": 10,
  "battery": 62,
  "signature": "9f2a7c3e8b104d55"
}
```

**Encoded bytes (hex, 47 bytes):**
```
a1 b2 c3 d4 e5 f6 78 90 ab cd ef 12 34 56 78 90   (packetId, 16 bytes)
f3 a9 c2 e1 b8 d0 4a 17                            (originDeviceId, 8 bytes)
xx xx xx xx                                        (latitude float32 LE)
xx xx xx xx                                        (longitude float32 LE)
84 6a 30 6b                                        (timestamp uint32 LE)
00                                                  (hopCount)
0a                                                  (ttl = 10)
3e                                                  (battery = 62)
9f 2a 7c 3e 8b 10 4d 55                            (signature, 8 bytes)
```

`decodePacket(encodePacket(packet))` should return a deep-equal object to the input (round-trip test — see `09-Testing-Checklist.md`).

---

## 4. Signature generation (HMAC)

```ts
// mobile-app/src/ble/signature.ts
import { hmac } from "some-hmac-lib"; // e.g. a React Native compatible crypto lib

const DEVICE_SECRET_KEY = "..."; // stored via react-native-encrypted-storage, provisioned at app install/registration

export function signPacketBytes(bytesWithoutSignature: Buffer): Buffer {
  const fullHmac = hmac("sha256", DEVICE_SECRET_KEY, bytesWithoutSignature);
  return fullHmac.subarray(0, 8); // truncate to 8 bytes for the wire format
}
```

Backend can optionally re-verify the full (non-truncated) signature if devices are pre-registered with known keys — truncated on-air signature is a spoofing deterrent, not cryptographic-strength authentication (8 bytes is a small space) — treat it as "raises the bar," not "unforgeable."

---

## 5. iOS vs Android scope

| Capability | Android | iOS |
|---|---|---|
| BLE scan (central) | Full support | Full support (foreground + limited background) |
| BLE advertise (peripheral) | Full support via `react-native-ble-advertiser` | Foreground only — background peripheral advertising is heavily restricted by Apple |
| Relay (receive + rebroadcast) | Full mesh participant | Foreground-only relay; treat iOS as a **partial mesh participant** for v1 |
| Gateway (upload when online) | Full support | Full support — this role doesn't depend on peripheral mode |

**Practical implication:** don't assume an iOS device will reliably relay while backgrounded. Document this limitation clearly in the app's UI/onboarding ("keep the app open for best relay performance on iPhone") rather than silently under-delivering.

---

## 6. GATT fallback for larger payloads

If you extend the packet format later (e.g. adding a short text note field) and exceed BLE advertising limits, switch that data to a GATT characteristic:

1. Advertise a minimal "SOS present nearby" beacon (just `packetId` + flag).
2. Scanning device connects via GATT and reads the full packet from a characteristic.
3. Adds connection overhead (slower, more battery) — only do this for data that doesn't fit in the 47-byte advertised payload.

Keep the core SOS packet in the advertised payload (no connection required) for speed and battery reasons — GATT is the exception path, not the default.
