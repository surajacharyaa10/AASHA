# BLE Mesh SOS — Constants & Tunables

Every fixed value the system relies on, in one place, with the reasoning behind each default so they can be safely tuned later.

---

## 1. Mesh protocol constants

| Constant | Default | Reasoning |
|---|---|---|
| `HOP_LIMIT` (TTL) | `10` | Too low → message dies before reaching a gateway in a sparse mesh. Too high → wasted battery relaying long-stale packets. 10 balances both for typical disaster-scene device density. |
| `DEDUP_CACHE_TTL` | `30–60 min` | Bounds how long a `packet_id` is remembered before eviction; long enough to prevent re-relay loops, short enough to bound memory. |
| `DEDUP_CACHE_MAX_ENTRIES` | `2,000` | Hard cap with oldest-eviction fallback — bounds worst-case memory regardless of packet flood volume (accidental or malicious). |
| `RELAY_QUIET_PERIOD` | `5 min` | Time with no new packets before a device drops from "relay-active" back to "idle" scan mode. |
| `MAX_PACKET_RETRANSMIT_ATTEMPTS` | `3` | Number of times a device retries broadcasting its own SOS if no ack/gateway confirmation received. |

---

## 2. BLE radio constants

| Constant | Default | Reasoning |
|---|---|---|
| `PACKET_SIZE` | `47 bytes` | Fixed binary struct (see layout below); kept under BLE advertising limits to minimize radio-on time. |
| `SCAN_WINDOW_IDLE` | `300 ms` | Scan duration per interval while idle. |
| `SCAN_INTERVAL_IDLE` | `10 s` | Time between scan windows while idle — biggest lever for idle battery savings. |
| `SCAN_WINDOW_RELAY_ACTIVE` | `1 s` | Wider scan window once the device has seen recent SOS traffic nearby. |
| `SCAN_INTERVAL_RELAY_ACTIVE` | `3 s` | Tighter interval during active relay to reduce discovery latency. |
| `ADVERTISE_TX_POWER_SOS` | `high` | Victim's own device broadcasts at maximum TX power for best range once SOS is triggered. |
| `AVG_HOP_DISCOVERY_LATENCY` | `1–5 s` | Approximate time for a neighboring device to discover a broadcast, scan-interval dependent — used to estimate end-to-end propagation time. |

---

## 3. Packet byte layout (fixed 47 bytes)

| Field | Bytes | Encoding |
|---|---|---|
| `packet_id` | 16 | raw UUID bytes (not string — string form is 36 bytes, 2.25x larger) |
| `origin_device_id` | 8 | truncated hash of device ID |
| `lat` | 4 | float32 |
| `lng` | 4 | float32 |
| `timestamp` | 4 | uint32 (seconds since epoch) |
| `hop_count` | 1 | uint8 |
| `ttl` | 1 | uint8 |
| `battery` | 1 | uint8 |
| `signature` | 8 | truncated HMAC |
| **Total** | **47** | |

---

## 4. Backend constants

| Constant | Default | Reasoning |
|---|---|---|
| `QUEUE_WORKER_CONCURRENCY` | `10` | Starting worker pool size for `bullmq` ingestion; scale based on DB write latency under load testing. |
| `QUEUE_DEPTH_ALERT_THRESHOLD` | `5,000` | Operational alert, not a hard limit — signals worker pool needs scaling. |
| `NEAREST_TEAM_QUERY_LIMIT` | `5` | Number of candidate teams returned per SOS event for dispatcher review. |
| `TEAM_COUNT_INDEX_THRESHOLD` | `~500` | Rough point at which to migrate nearest-team lookup from linear Haversine scan to PostGIS `GIST` index. |
| `EVENT_DEDUP_WINDOW` | indefinite (DB unique constraint) | `packet_id` uniqueness enforced permanently at the DB level, not time-windowed. |

---

## 5. Dashboard/WebSocket constants

| Constant | Default | Reasoning |
|---|---|---|
| `WS_ROOM_SHARDING_THRESHOLD` | `~200 connected clients` | Point at which to shard WebSocket broadcast rooms by geographic region rather than one global broadcast room. |
| `MAP_CLUSTER_ZOOM_THRESHOLD` | app-tunable | Below this zoom level, cluster pins instead of rendering each individually, to keep map rendering smooth during mass-casualty spikes. |

---

## 6. Security constants

| Constant | Default | Reasoning |
|---|---|---|
| `SOS_TRIGGER_CONFIRM_MODE` | press-and-hold (e.g. 2s) | Prevents accidental single-tap false alarms. |
| `SIGNATURE_ALGO` | HMAC-SHA256 (truncated to 8 bytes on-air) | Prevents spoofed SOS packets from unregistered devices; full signature verified server-side if needed. |
| `JWT_EXPIRY` (dashboard auth) | `8 h` | Standard dispatcher shift-length session expiry. |
