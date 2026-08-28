# BLE Mesh SOS — Disaster Alert System

**Project docs & roadmap**
Mobile app (React Native) → BLE mesh relay → Backend (Node.js) → Dashboard (Next.js) → Rescue dispatch

---

## 1. Problem statement

During disasters (earthquakes, floods, building collapse) cellular and Wi-Fi infrastructure is often down or overloaded, and victims may be out of network range entirely. This system lets a victim trigger an SOS from their phone, which propagates **peer-to-peer over Bluetooth Low Energy (BLE)** — hopping from phone to phone — until it reaches any device with internet access. That device uploads it to a backend, which alerts a rescue dashboard with the victim's location in real time.

---

## 2. Goals & non-goals

**Goals**
- One-tap SOS trigger with GPS location capture
- Works with zero internet/cellular connectivity at the point of origin
- Message survives multiple hops across a phone-to-phone mesh
- Rescue teams see live incoming SOS events on a map with location + metadata
- Rescue teams can be assigned/dispatched to specific incidents

**Non-goals (v1)**
- Two-way chat between victim and rescue team over BLE (future phase)
- Full mesh routing optimization (v1 uses simple flood relay, not optimal-path routing)
- iOS full peripheral mesh participation (iOS background BLE peripheral mode is heavily restricted by Apple — see Risks)

---

## 3. High-level architecture

```
[Victim's phone]
   SOS button → capture GPS + device ID → build SOS packet
        │  BLE advertise/broadcast
        ▼
[Relay phone(s)]
   Scan → receive packet → dedup check → decrement TTL → re-broadcast
        │  (repeats across N hops until...)
        ▼
[Gateway phone] (any phone in the mesh with internet)
   Detects packet → uploads via REST to backend
   Also continues BLE relay in parallel
        │  HTTPS POST /api/sos
        ▼
[Backend — Node.js]
   Validate → dedup by packet_id → store in DB → push via WebSocket
        │
        ▼
[Dashboard — Next.js]
   Live map pin appears → dispatcher assigns rescue team → status tracked
        │
        ▼
[Rescue team]
   Notified (push/FCM) → navigates to location → marks resolved
```

---

## 4. SOS packet format

Keep the payload small — BLE advertising packets are limited (~31 bytes raw, more via scan response or GATT characteristics).

| Field | Type | Size | Notes |
|---|---|---|---|
| `packet_id` | UUID (or 8-byte hash) | 8–16 bytes | For dedup across the mesh |
| `origin_device_id` | string/hash | 8 bytes | Anonymized device identifier |
| `lat` | float32 | 4 bytes | Latitude |
| `lng` | float32 | 4 bytes | Longitude |
| `timestamp` | uint32 | 4 bytes | Unix epoch (seconds) |
| `hop_count` | uint8 | 1 byte | Incremented at each relay |
| `ttl` | uint8 | 1 byte | Max hops before message is dropped (e.g. 10) |
| `battery` | uint8 | 1 byte | Optional, victim's phone battery % |
| `signature` | bytes | 8–16 bytes | HMAC/signature to prevent spoofed SOS packets |

> For payloads over BLE advertising limits, use a GATT characteristic write once two devices connect, rather than cramming everything into the advertisement packet.

---

## 5. BLE mesh relay protocol (flood relay with dedup)

1. Victim's app advertises the SOS packet continuously.
2. Every nearby phone running the app scans in the background.
3. On receiving a packet:
   - Check local dedup cache for `packet_id`. If seen → ignore.
   - If new → store in cache, increment `hop_count`, and if `hop_count < ttl`, re-broadcast.
   - If phone has internet (`NetInfo` check) → immediately POST to backend regardless of relay status.
4. Dedup cache entries expire after a TTL window (e.g. 30–60 min) to bound memory use.
5. Backend also dedups by `packet_id` in case multiple gateway phones upload the same event.

This is deliberately simple (no routing tables, no path optimization) because disaster mesh topology is unpredictable and short-lived — flood relay is the most robust choice for v1.

---

## 6. Tech stack & packages

### Mobile app (React Native)
| Purpose | Package |
|---|---|
| BLE central (scan/connect) | `react-native-ble-plx` |
| BLE peripheral/advertise (Android) | `react-native-ble-advertiser` |
| BLE alternative/backup | `react-native-ble-manager` |
| Background service | `react-native-background-actions` |
| Persistent notification | `@notifee/react-native` |
| Permissions | `react-native-permissions` |
| GPS | `react-native-geolocation-service` |
| Connectivity detection | `@react-native-community/netinfo` |
| HTTP client | `axios` |
| Realtime (optional) | `socket.io-client` |
| Storage (dedup cache) | `react-native-mmkv` (or `@react-native-async-storage/async-storage`) |
| UUID generation | `react-native-uuid` |
| Device info/battery | `react-native-device-info` |
| Secure key storage | `react-native-encrypted-storage` |
| Binary encoding | `buffer` |
| State management | `zustand` |

### Backend (Node.js)
| Purpose | Package |
|---|---|
| Server framework | `express` |
| Realtime push | `socket.io` |
| ORM | `prisma` (+ `pg` for Postgres) |
| Validation | `zod` |
| Auth | `jsonwebtoken`, `bcrypt` |
| Push notifications | `firebase-admin` |
| Geospatial queries | PostGIS (Postgres extension) or `geolib` |
| Job queue / retries | `bullmq` + Redis |
| Logging | `pino` |
| Testing | `jest`, `supertest` |
| Middleware | `cors`, `helmet`, `compression`, `dotenv` |

### Dashboard (Next.js)
| Purpose | Package |
|---|---|
| Framework | `next`, `react`, `react-dom` |
| Map | `react-map-gl` + `mapbox-gl` (or `react-leaflet` + `leaflet`) |
| Geospatial helpers | `@turf/turf` |
| Realtime | `socket.io-client` |
| Server state | `@tanstack/react-query` |
| UI state | `zustand` |
| Styling/components | `tailwindcss`, `shadcn/ui` |
| Charts | `recharts` |
| Forms | `react-hook-form`, `zod` |
| Auth | `next-auth` |
| Dates | `date-fns` |

---

## 7. Database schema (PostgreSQL + PostGIS)

```sql
-- SOS events
CREATE TABLE sos_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id      TEXT UNIQUE NOT NULL,
  origin_device_id TEXT NOT NULL,
  latitude       DOUBLE PRECISION NOT NULL,
  longitude      DOUBLE PRECISION NOT NULL,
  battery        SMALLINT,
  hop_count      SMALLINT,
  status         TEXT NOT NULL DEFAULT 'pending', -- pending | assigned | resolved | false_alarm
  reported_at    TIMESTAMPTZ NOT NULL,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_team_id UUID REFERENCES rescue_teams(id),
  resolved_at    TIMESTAMPTZ
);

-- Rescue teams
CREATE TABLE rescue_teams (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  phone          TEXT,
  status         TEXT NOT NULL DEFAULT 'available', -- available | busy | offline
  current_lat    DOUBLE PRECISION,
  current_lng    DOUBLE PRECISION,
  fcm_token      TEXT,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Dispatch / admin users
CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT UNIQUE NOT NULL,
  password_hash  TEXT NOT NULL,
  role           TEXT NOT NULL DEFAULT 'dispatcher', -- admin | dispatcher
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. API design

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/sos` | Gateway phone submits a received SOS packet |
| `GET` | `/api/sos` | List events (filter by status, time range) |
| `GET` | `/api/sos/:id` | Get single event details |
| `PATCH` | `/api/sos/:id/assign` | Assign a rescue team to an event |
| `PATCH` | `/api/sos/:id/resolve` | Mark event resolved |
| `GET` | `/api/teams` | List rescue teams + status |
| `POST` | `/api/teams` | Add a rescue team |
| `PATCH` | `/api/teams/:id/location` | Update team's live location |
| `POST` | `/api/auth/login` | Dispatcher/admin login |
| WS event | `sos:new` | Pushed to dashboard when a new event is stored |
| WS event | `sos:updated` | Pushed when status/assignment changes |

---

## 9. Roadmap

### Phase 0 — Research & feasibility (1–2 weeks)
- Spike `react-native-ble-plx` + `react-native-ble-advertiser` on real Android devices
- Measure real-world BLE range, discovery latency, and background reliability
- Decide final packet format and TTL/hop-limit values through small-scale testing (5–10 devices)
- Confirm iOS BLE background limitations and decide iOS scope for v1

### Phase 1 — MVP: single-hop SOS (2–3 weeks)
- SOS button UI + GPS capture
- Direct BLE broadcast/receive between two devices
- Manual gateway phone forwards to backend over Wi-Fi/cellular
- Basic Express API + Postgres schema
- Basic Next.js dashboard: map with pins, event list

### Phase 2 — Multi-hop mesh (3–4 weeks)
- Implement flood relay with dedup cache + TTL/hop-count across 3+ devices
- Foreground service + persistent notification to keep BLE alive on Android
- Automatic gateway detection (`NetInfo`-based) — any phone with internet auto-uploads
- Packet signing to prevent spoofed SOS events

### Phase 3 — Dashboard & dispatch workflow (2–3 weeks)
- Real-time WebSocket updates on dashboard
- Team assignment UI, status tracking (pending → assigned → resolved)
- FCM push notifications to assigned rescue teams
- Dispatcher/admin auth with `next-auth`

### Phase 4 — Hardening & field testing (ongoing)
- Battery optimization: adaptive scan/advertise duty cycling
- False-trigger prevention (press-and-hold/double confirm)
- Offline queue on gateway side if backend upload fails, with retry via `bullmq`
- Load testing dashboard with many concurrent events
- Real-world mesh range testing (open field vs. indoor/rubble obstruction)
- Encryption review, penetration testing on API

### Phase 5 — Stretch goals
- Two-way BLE messaging (victim ↔ rescue team status updates)
- Smarter mesh routing (beyond flood relay) using gateway beacons
- Offline maps on rescue team app
- Multi-language SOS app UI
- Analytics: response time dashboards, incident heatmaps

---

## 10. Key risks & mitigations

| Risk | Mitigation |
|---|---|
| BLE background restrictions on iOS | Treat iOS primarily as scanner/gateway in v1; full peripheral mesh participation is an Android-first feature |
| Battery drain from continuous BLE scan/advertise | Duty-cycled scanning (e.g. 2s scan every 10s) outside of active-SOS mode |
| Spoofed/false SOS packets | Require device registration + packet signing (HMAC), require press-and-hold to trigger |
| Short BLE range (~10–30m) limits mesh reach | Be transparent with stakeholders: mesh effectiveness scales with number of active app users nearby |
| Duplicate events from multiple gateways | Dedup by `packet_id` at both device and backend level |
| Dashboard overload during mass-casualty events | Rate-limit ingestion, queue processing via `bullmq`, paginate/cluster map pins |

---

## 11. Suggested repo structure

```
ble-sos-system/
├── mobile-app/            # React Native app
│   ├── src/
│   │   ├── ble/           # scan, advertise, relay protocol logic
│   │   ├── screens/
│   │   ├── services/       # api client, location, storage
│   │   └── store/
│   └── package.json
├── backend/                # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── sockets/
│   │   └── prisma/
│   └── package.json
├── dashboard/               # Next.js app
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
└── docs/
    └── BLE-SOS-Disaster-App-Docs.md
```
