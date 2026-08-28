# BLE Mesh SOS — API & Schema Spec

This is the source of truth for field names and shapes. When using Claude Code / Codex to generate mobile, backend, or dashboard code in separate sessions, paste this doc into context first so all three stay in agreement.

---

## 1. Prisma schema (backend/prisma/schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model SosEvent {
  id               String   @id @default(uuid())
  packetId         String   @unique @map("packet_id")
  originDeviceId   String   @map("origin_device_id")
  latitude         Float
  longitude        Float
  battery          Int?
  hopCount         Int?     @map("hop_count")
  status           String   @default("pending") // pending | assigned | resolved | false_alarm
  reportedAt       DateTime @map("reported_at")
  receivedAt       DateTime @default(now()) @map("received_at")
  assignedTeamId   String?  @map("assigned_team_id")
  assignedTeam     RescueTeam? @relation(fields: [assignedTeamId], references: [id])
  resolvedAt       DateTime? @map("resolved_at")

  @@map("sos_events")
}

model RescueTeam {
  id          String   @id @default(uuid())
  name        String
  phone       String?
  status      String   @default("available") // available | busy | offline
  currentLat  Float?   @map("current_lat")
  currentLng  Float?   @map("current_lng")
  fcmToken    String?  @map("fcm_token")
  updatedAt   DateTime @default(now()) @updatedAt @map("updated_at")
  events      SosEvent[]

  @@map("rescue_teams")
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  role         String   @default("dispatcher") // admin | dispatcher
  createdAt    DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

---

## 2. REST API — exact request/response shapes

### `POST /api/sos`
Gateway phone submits a received SOS packet.

**Request body:**
```json
{
  "packetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "originDeviceId": "f3a9c2e1",
  "latitude": 27.7172,
  "longitude": 85.3240,
  "battery": 62,
  "hopCount": 3,
  "reportedAt": "2026-08-27T09:15:00.000Z"
}
```

**Response `202 Accepted`:**
```json
{ "accepted": true, "packetId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890" }
```

**Response `409 Conflict`** (duplicate packetId, already ingested):
```json
{ "accepted": false, "reason": "duplicate" }
```

---

### `GET /api/sos?status=pending&from=&to=&limit=50&cursor=`
List events.

**Response `200`:**
```json
{
  "events": [
    {
      "id": "uuid",
      "packetId": "uuid",
      "latitude": 27.7172,
      "longitude": 85.3240,
      "battery": 62,
      "hopCount": 3,
      "status": "pending",
      "reportedAt": "2026-08-27T09:15:00.000Z",
      "receivedAt": "2026-08-27T09:15:04.000Z",
      "assignedTeam": null
    }
  ],
  "nextCursor": "uuid-or-null"
}
```

---

### `GET /api/sos/:id`
**Response `200`:** single event object (same shape as above array item, expanded with `assignedTeam` object if set).

---

### `PATCH /api/sos/:id/assign`
**Request body:**
```json
{ "teamId": "uuid" }
```
**Response `200`:** updated event object. Emits WS event `sos:updated`.

---

### `PATCH /api/sos/:id/resolve`
**Request body:**
```json
{ "resolution": "resolved" }
```
`resolution` is `resolved` or `false_alarm`.
**Response `200`:** updated event object. Emits WS event `sos:updated`.

---

### `GET /api/teams?status=available`
**Response `200`:**
```json
{
  "teams": [
    { "id": "uuid", "name": "Team Alpha", "phone": "+977...", "status": "available", "currentLat": 27.71, "currentLng": 85.32 }
  ]
}
```

### `POST /api/teams`
**Request body:**
```json
{ "name": "Team Alpha", "phone": "+977..." }
```
**Response `201`:** created team object.

### `PATCH /api/teams/:id/location`
**Request body:**
```json
{ "lat": 27.71, "lng": 85.32 }
```
**Response `200`:** updated team object.

---

### `POST /api/auth/login`
**Request body:**
```json
{ "email": "dispatcher@example.com", "password": "..." }
```
**Response `200`:**
```json
{ "token": "jwt...", "user": { "id": "uuid", "email": "...", "role": "dispatcher" } }
```

---

## 3. WebSocket events (Socket.io)

| Event | Direction | Payload |
|---|---|---|
| `sos:new` | server → dashboard | full event object, same shape as `GET /api/sos/:id` |
| `sos:updated` | server → dashboard | full event object (after assign/resolve) |
| `team:updated` | server → dashboard | team object (after location/status change) |

Dashboard subscribes on connect:
```ts
socket.on("sos:new", (event) => { /* add pin to map, add to list */ });
socket.on("sos:updated", (event) => { /* patch existing event in state */ });
socket.on("team:updated", (team) => { /* patch team marker */ });
```

---

## 4. BLE-side packet shape (mobile app, before it becomes the HTTP body above)

This is the in-memory object each app builds/parses before binary-encoding it for the radio (see `08-BLE-Protocol-Spec.md` for the byte layout):

```ts
interface SosPacket {
  packetId: string;       // UUID
  originDeviceId: string;
  latitude: number;
  longitude: number;
  timestamp: number;      // unix seconds
  hopCount: number;
  ttl: number;
  battery: number;
  signature: string;      // hex, truncated HMAC
}
```

When a gateway phone uploads this to `POST /api/sos`, map `timestamp` → `reportedAt` (ISO string) and drop `ttl`/`signature` from the HTTP body (signature is verified separately if implemented server-side; ttl is a relay-only concern).

---

## 5. Field naming convention (keep consistent everywhere)

- **Database columns:** `snake_case` (Postgres convention)
- **Prisma model fields / backend JS objects:** `camelCase` (Prisma maps automatically via `@map`)
- **JSON API request/response bodies:** `camelCase`
- **BLE binary packet fields:** fixed byte offsets, no naming ambiguity (see `08-BLE-Protocol-Spec.md`)

If an AI coding session ever produces `snake_case` in an API response or a mobile app object, that's a bug — flag it and fix it before merging.
