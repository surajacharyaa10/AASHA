# BLE Mesh SOS — Memory & Resource Footprint

Where memory, storage, and battery are actually spent across the system, with numbers.

---

## 1. Mobile app — dedup cache

- Each entry: `packet_id` (16 bytes UUID) + expiry timestamp (8 bytes) + hash map overhead (~24–32 bytes in JS engines) ≈ **~60–70 bytes/entry**
- At a busy disaster scene, up to ~500 distinct SOS packets active in a 30-minute window: `500 × 70B ≈ 35 KB` — negligible.
- Hard cap at `2,000` entries (see `02-Constants.md`) bounds worst-case memory to roughly **140 KB**, regardless of flood volume.
- Storage engine choice matters here: `react-native-mmkv` is synchronous and O(1) per op; `AsyncStorage` is async and noticeably slower under the frequent read/write this cache sees on every BLE packet received.

---

## 2. Mobile app — radio/battery cost (the real bottleneck)

BLE scanning, not storage, is the dominant resource cost of this app. Two levers control it:

- **Payload size:** fixed 47-byte binary packet vs. a naive JSON payload (~180–250 bytes) is roughly a **4–5x reduction** in radio-on time per hop — this compounds across every hop, network-wide.
- **Duty cycling:** continuous scanning (worst case) vs. idle-state 300ms/10s duty cycle can be a >10x reduction in radio-on time while the app is not actively relaying. See the state machine in `01-Algorithms.md` and thresholds in `02-Constants.md`.

There is no meaningful RAM cost from BLE itself — the entire mobile "memory" story is: small fixed cache (see above) + battery, not heap size.

---

## 3. Backend — database growth

- `sos_events` row: roughly ~150–250 bytes per row (UUIDs, floats, timestamps, status text, foreign keys) — **negligible per-event**, but plan retention policy for long-running deployments (e.g. archive events older than N months to cold storage).
- Unique index on `packet_id`: one B-tree entry per event, sub-linear lookup cost, index size scales linearly with event count but stays small relative to typical Postgres instance sizing even at hundreds of thousands of events.
- `rescue_teams`: tiny table, hundreds to low thousands of rows even at large scale — not a memory concern.

---

## 4. Backend — ingestion queue (Redis)

- Each queued job (`bullmq`): payload + metadata, roughly 200–500 bytes per job depending on serialization overhead.
- At the alert threshold of 5,000 queued jobs (see `02-Constants.md`): `5,000 × 500B ≈ 2.5 MB` — trivial for Redis; the threshold is an *operational* signal to scale workers, not a memory ceiling.

---

## 5. Dashboard — client-side

- WebSocket event payloads are plain JSON (no radio constraint on this leg) — a single SOS event object is well under 1 KB.
- Map rendering cost scales with number of visible pins, not raw event count — use clustering (`MAP_CLUSTER_ZOOM_THRESHOLD`) so rendered DOM/canvas nodes stay bounded even during a mass-casualty spike with thousands of historical events in the DB.

---

## 6. Summary — where memory/resources actually matter

| Layer | Resource that matters | Bound |
|---|---|---|
| Mobile dedup cache | RAM/storage | ~140 KB worst case (capped) |
| Mobile BLE radio | Battery, not RAM | Governed by duty cycling + packet size, not storage |
| Backend DB | Disk, growing over time | ~150–250 bytes/event; needs a retention/archive policy for long deployments |
| Backend queue | Redis RAM | ~2.5 MB at alert threshold; trivial |
| Dashboard | Rendering cost, not raw memory | Bounded via map pin clustering |

**Bottom line:** nothing in this system has a real "big memory" problem at expected disaster-response scale (thousands, not millions, of events). The actual constrained resource is **mobile battery**, driven by BLE radio-on time — every other memory number here is small enough that correctness and battery discipline matter far more than storage optimization.
