# BLE Mesh SOS — Testing Checklist

BLE mesh behavior is hard to unit test meaningfully — most of the real bugs only show up on physical devices. Use this as a repeatable manual checklist alongside whatever automated tests exist for the backend/dashboard.

---

## 1. Automated tests (can run in CI)

| Area | Test | Tool |
|---|---|---|
| Packet codec | `decodePacket(encodePacket(x))` round-trips exactly for several sample packets | `jest` (mobile) |
| Packet codec | Decoding a wrong-length buffer throws | `jest` |
| Dedup cache | Second insert of same `packetId` is a no-op | `jest` |
| Dedup cache | Entry expires after TTL window | `jest` (with fake timers) |
| Backend API | `POST /api/sos` twice with same `packetId` → second returns 409 | `jest` + `supertest` |
| Backend API | `PATCH /api/sos/:id/assign` emits `sos:updated` WS event | `jest` + socket.io test client |
| Nearest-team query | Returns closest team first for a known set of coordinates | `jest` against test DB |
| Auth | Invalid JWT rejected on protected routes | `jest` + `supertest` |

---

## 2. Manual test — 2-device direct relay (Phase 1 MVP gate)

**Setup:** Device A (victim), Device B (gateway, has internet), both app installed, within ~10m.

1. [ ] Trigger SOS on Device A (press-and-hold).
2. [ ] Confirm Device A shows "broadcasting" status.
3. [ ] Confirm Device B receives the packet (check relay/status screen).
4. [ ] Confirm Device B uploads to backend (check backend logs / dashboard).
5. [ ] Confirm dashboard shows a new pin within a few seconds.
6. [ ] Confirm event `latitude`/`longitude` on dashboard matches Device A's actual location.

---

## 3. Manual test — 3+ device multi-hop relay (Phase 2 gate)

**Setup:** Device A (victim, no internet — enable airplane mode + BLE only), Device B (relay only, no internet), Device C (gateway, has internet). Arrange so A is out of range of C directly, but in range of B, and B in range of C.

1. [ ] Trigger SOS on Device A.
2. [ ] Confirm Device B receives and rebroadcasts (check `hopCount` incremented on B's relay log).
3. [ ] Confirm Device C receives the relayed (not original) packet and uploads it.
4. [ ] Confirm dashboard event shows `hopCount: 2` (or however many hops occurred).
5. [ ] Move Device B out of range mid-test — confirm the mesh gracefully fails to deliver (expected behavior, not a bug) and no crash occurs on any device.
6. [ ] Trigger a second SOS from Device A — confirm it gets a new distinct `packetId` and isn't deduped against the first.

---

## 4. Manual test — dedup correctness

1. [ ] With 3+ relay devices in range of each other, trigger one SOS.
2. [ ] Confirm each relay device rebroadcasts the packet **only once**, not repeatedly (watch relay logs for a few minutes).
3. [ ] Confirm no infinite relay loop occurs between two devices in mutual range.

---

## 5. Manual test — battery/duty-cycle behavior

1. [ ] Leave app idle (no SOS activity nearby) for 15+ minutes, monitor battery drain via OS battery stats.
2. [ ] Compare against continuous-scan baseline (temporarily hardcode `SCAN_INTERVAL_IDLE` to 0 for this test only) to confirm duty cycling meaningfully reduces drain.
3. [ ] Confirm device transitions from "relay-active" back to "idle" scan mode after `RELAY_QUIET_PERIOD` with no new packets.

---

## 6. Manual test — dashboard & dispatch flow

1. [ ] New SOS event appears on map in real time without a page refresh.
2. [ ] Assign a rescue team from the dashboard — confirm event status updates to "assigned" for all connected dispatcher sessions (open dashboard in 2 browser tabs to check fan-out).
3. [ ] Mark event resolved — confirm it's removed from the "pending" filter view but still visible in history.
4. [ ] Confirm assigned team receives a push notification (check FCM delivery on a test device with the rescue-team-facing app/flow).

---

## 7. Manual test — false-trigger prevention & security

1. [ ] Single tap on SOS button does **not** trigger (only press-and-hold does).
2. [ ] Send a manually crafted packet with an invalid/missing signature directly to a test relay device (via a debug tool) — confirm it's rejected, not relayed.
3. [ ] Attempt `POST /api/sos` without a valid device-originated signature (if server-side verification is implemented) — confirm rejection.
4. [ ] Confirm dashboard requires login — unauthenticated requests to `/api/sos` write endpoints are rejected with 401.

---

## 8. Load/stress test (Phase 4 hardening gate)

1. [ ] Script 500+ simulated `POST /api/sos` requests with unique `packetId`s in a short burst — confirm backend queues rather than dropping/erroring, and DB writes complete without data loss.
2. [ ] Confirm dashboard remains responsive (map doesn't freeze) with 500+ events loaded — verify clustering kicks in.
3. [ ] Confirm Redis queue depth alert threshold triggers correctly when crossed (see `02-Constants.md`).

---

## 9. Field test (real-world, pre-launch)

1. [ ] Test outdoors, open field — measure actual BLE range achieved (compare to assumed ~10–30m).
2. [ ] Test indoors / through walls — measure range degradation.
3. [ ] Test with 5+ real devices spread across a realistic area (parking lot, park) to observe real mesh behavior, not just lab conditions.
4. [ ] Time end-to-end latency from SOS trigger to dashboard pin appearing, across 2-hop and 3-hop scenarios — compare against the `AVG_HOP_DISCOVERY_LATENCY` estimate in `02-Constants.md`.
