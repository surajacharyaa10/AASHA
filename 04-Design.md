# BLE Mesh SOS — Design Principles

The reasoning that ties the algorithms, constants, and memory budgets together. Read this after the other three docs to see *why* the choices were made.

---

## 1. Push cost to the cheapest layer

Dedup happens on-device, before a packet ever touches the radio again — the most expensive resource (BLE airtime/battery) is protected first. Convergence dedup (multiple gateways uploading the same event) is pushed to a database-level unique constraint rather than application-layer locking, because the DB is the cheapest place to guarantee correctness under concurrent writes without race conditions.

---

## 2. Bound everything with a cap or TTL

Every unbounded-looking resource in this system has an explicit ceiling:
- Dedup cache → `DEDUP_CACHE_MAX_ENTRIES` cap with oldest-eviction
- Packet lifetime → `HOP_LIMIT` (TTL)
- Relay-active state → `RELAY_QUIET_PERIOD` timeout back to idle
- Ingestion queue → alert threshold, not infinite growth

This matters specifically *because* it's a disaster-response system — conditions where manual intervention to fix a runaway process may not be possible. Nothing should be allowed to grow unbounded and degrade the app when it's needed most.

---

## 3. Fixed-size binary over the radio, flexible JSON everywhere else

The BLE hop is the one genuinely scarce, battery-costly resource in the whole architecture. It gets a purpose-built 47-byte binary encoding. Every other leg of the system — gateway-to-backend HTTP, backend-to-dashboard WebSocket — has no such constraint, so plain JSON is used there because it's easier to build, debug, and extend. Don't over-optimize legs that aren't the bottleneck.

---

## 4. Start simple; upgrade only when load-testing says to

- Nearest-team lookup ships as a linear Haversine scan (`O(T)`) in v1, and only migrates to a PostGIS spatial index (`O(log T)`) once team count or event volume in Phase 4 hardening actually demonstrates the need.
- WebSocket fan-out ships as a single broadcast room, and only shards by geographic region once connected-client count crosses a real threshold.

Premature optimization here would slow down the MVP timeline for scale the project may never hit in early deployments. The architecture leaves clear upgrade paths (documented in `01-Algorithms.md` and `02-Constants.md`) rather than pre-building complexity that isn't needed yet.

---

## 5. Flood relay over optimal routing

A disaster mesh's topology is unpredictable and short-lived — devices come and go as people move, phones die, and buildings block signal. Optimal-path routing algorithms (which assume a relatively stable graph) aren't a good fit. Flood relay with a dedup gate is deliberately "dumb" but robust: it doesn't need to know the mesh topology in advance, degrades gracefully as devices drop out, and its total-transmission cost is bounded to `O(N)` per event specifically because of the dedup cache — see `01-Algorithms.md §2`.

---

## 6. Battery discipline is the core design constraint, not memory or CPU

Every other resource in this system (mobile RAM, backend disk, Redis memory) is small enough at expected disaster-response scale that it's a non-issue — see `03-Memory.md §6`. Battery, driven by BLE radio-on time, is the one resource that can actually fail the mission: a dead phone can't relay or receive an SOS. This is why:
- Packet encoding is optimized for size over convenience
- Scan/advertise duty cycling exists as an explicit state machine, not just "always scan"
- The victim's own device is the one exception that gets continuous, high-power broadcast — because for that specific device, maximizing chance of rescue outweighs battery preservation

---

## 7. Confirm-to-trigger, verify-to-trust

Two deliberate frictions are added despite this being an emergency tool:
- **Press-and-hold to trigger SOS** — prevents accidental single-tap false alarms that would waste rescue capacity.
- **Signed packets (HMAC)** — prevents spoofed SOS events from flooding the dashboard, which would be both a nuisance and, at scale, a denial-of-service risk against real victims' signals getting attention.

Both add negligible latency to a genuine SOS trigger while meaningfully protecting the system's trustworthiness under adversarial or accidental conditions.

---

## 8. Design docs map

| Doc | Covers |
|---|---|
| `01-Algorithms.md` | The actual algorithms and their time complexity |
| `02-Constants.md` | Every tunable value and the reasoning behind its default |
| `03-Memory.md` | Real memory/storage/battery numbers per layer |
| `04-Design.md` (this doc) | The principles connecting the above three |
