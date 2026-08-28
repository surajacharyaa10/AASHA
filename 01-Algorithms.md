# BLE Mesh SOS — Algorithms

Core algorithms used across mobile, backend, and dashboard, with time complexity for each.

---

## 1. Dedup cache (mobile — every relay node)

Recognize "already seen this packet" instantly so a device never rebroadcasts the same SOS twice.

```
seen = HashMap<packet_id, expiry_timestamp>

on receive(packet):
    if packet.id in seen:            # O(1) average
        drop packet
        return
    seen[packet.id] = now + TTL_WINDOW
    hop_count = packet.hop_count + 1
    if hop_count < packet.ttl:
        rebroadcast(packet with hop_count)
    if has_internet():
        upload(packet)                # gateway path, independent of relay
```

- Lookup / insert: **O(1) average** (hash map)
- Periodic eviction sweep: **O(k)**, k = expired entries, run every N seconds (amortized) rather than on every insert

---

## 2. Flood relay propagation (network-wide)

How an SOS packet spreads across the mesh. Every device relays a given packet **at most once** (gated by its dedup cache), so total transmissions per event across a mesh of N nearby devices is:

- Total transmissions per SOS event: **O(N)** — not `O(N^h)` — because the dedup cache prevents repeat rebroadcasts.
- Time-to-gateway: **O(hop_distance × avg_discovery_latency)**, where discovery latency is BLE-scan-interval dependent (typically 1–5s/hop).

---

## 3. Packet encoding/decoding

Fixed-width binary struct packing instead of JSON, to minimize BLE radio-on time.

- Encode/decode: **O(1)** — no parsing, no tokenizing, fixed offsets.
- See `02-Constants.md` for the exact byte layout.

---

## 4. Nearest-rescue-team assignment (backend)

**v1 — naive linear scan**, Haversine distance to every team:

```sql
SELECT id, name,
  ( 6371 * acos(
      cos(radians($lat)) * cos(radians(current_lat)) *
      cos(radians(current_lng) - radians($lng)) +
      sin(radians($lat)) * sin(radians(current_lat))
    )
  ) AS distance_km
FROM rescue_teams
WHERE status = 'available'
ORDER BY distance_km ASC
LIMIT 5;
```
Complexity: **O(T)**, T = number of teams. Fine below ~500 teams.

**v2 — PostGIS spatial index** (Phase 4+, once team count grows):

```sql
CREATE INDEX idx_teams_location ON rescue_teams USING GIST (location);

SELECT id, name, ST_Distance(location, ST_MakePoint($lng, $lat)::geography) AS distance_m
FROM rescue_teams
WHERE status = 'available'
ORDER BY location <-> ST_MakePoint($lng, $lat)::geography
LIMIT 5;
```
Complexity: **O(log T)**.

---

## 5. Event dedup at backend (multi-gateway convergence)

The same packet can arrive from several gateway phones at once. Push dedup to the database instead of application-layer check-then-insert (which has a race window):

```sql
INSERT INTO sos_events (packet_id, ...) VALUES (...)
ON CONFLICT (packet_id) DO NOTHING
RETURNING id;
```
Complexity: **O(1) amortized** via the unique B-tree index on `packet_id`.

---

## 6. Real-time dashboard fan-out

New/updated SOS events pushed to every connected dispatcher via a WebSocket room broadcast (Socket.io).

Complexity: **O(C)**, C = connected dashboard clients. If C grows large, shard by geographic `room` so each dispatcher only receives relevant-region events.

---

## 7. Battery-aware scan/advertise duty cycling (mobile)

A finite state machine that changes BLE scan aggressiveness based on app state.

| App state | Scan window | Scan interval | Advertise |
|---|---|---|---|
| Idle | 300ms | every 10s | off |
| Relay-active | 1s | every 3s | off (unless self-triggered) |
| SOS-triggered (victim) | continuous | continuous | continuous, high TX power |

Complexity: **O(1)** state transitions. The design value is in tuning the thresholds (see `02-Constants.md`), not the algorithm itself.

---

## 8. Backend ingestion backpressure

A queue-based ingestion pipeline (`bullmq` + Redis) decouples burst load from DB write throughput.

```
POST /api/sos → validate (zod) → enqueue job → 202 Accepted
                                        │
                                        ▼
                              worker pool (N concurrent)
                                        │
                              dedup + insert + WS emit
```
Complexity: **O(1)** enqueue per request from the client's perspective; effective throughput scales with worker pool size N.
