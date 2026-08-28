# BLE Mesh SOS — Security Checklist

Expanded from the security constants in `02-Constants.md`. Work through this before the system ever touches a real disaster scenario — false or spoofed SOS events waste rescue capacity and cost trust.

---

## 1. Packet authenticity

- [ ] Every device is provisioned with a unique signing key at install/registration time, stored via `react-native-encrypted-storage` (never in plain AsyncStorage, never hardcoded).
- [ ] Packets are HMAC-signed before broadcast (see `08-BLE-Protocol-Spec.md §4`).
- [ ] Relay devices reject/drop packets with malformed signatures rather than silently relaying anyway.
- [ ] Understand and document the limitation: an 8-byte truncated signature deters casual spoofing but is not cryptographically unforgeable — treat as a bar-raiser, not a guarantee, and don't oversell this to stakeholders.
- [ ] Backend independently verifies signatures where device keys are known/registered (defense in depth, not just device-side trust).

---

## 2. False-trigger prevention

- [ ] SOS button requires press-and-hold (or double confirm), not a single tap.
- [ ] Consider a short "cancel window" (e.g. 3 seconds) after trigger, in case of accidental activation, before the broadcast actually starts.
- [ ] Rate-limit how often a single device can trigger new SOS events (e.g. max 1 per 5 minutes) to blunt a malfunctioning or compromised device flooding the mesh.

---

## 3. Backend API security

- [ ] All write endpoints (`POST /api/sos`, `PATCH /api/sos/:id/*`, `/api/teams/*`) require authentication except the gateway ingestion endpoint, which should instead be protected by packet-level signature verification and/or an API key issued to the mobile app build.
- [ ] Dashboard-facing endpoints require a valid JWT (`Authorization: Bearer ...`), checked via middleware on every protected route.
- [ ] Passwords hashed with `bcrypt` (never plain text, never reversible encryption).
- [ ] `JWT_SECRET` is a strong random value, unique per environment, never committed to version control.
- [ ] Rate limiting on `/api/auth/login` to prevent brute-force attempts (e.g. `express-rate-limit`).
- [ ] Input validation on every endpoint via `zod` schemas (reject malformed lat/lng, out-of-range battery values, oversized strings, etc.) before it ever reaches a DB query.
- [ ] SQL injection is not a concern with Prisma's parameterized queries — confirm no raw SQL string concatenation is used anywhere (`$queryRawUnsafe` should not appear in the codebase).

---

## 4. Transport security

- [ ] Backend API served over HTTPS only in production (no plain HTTP).
- [ ] WebSocket connections upgraded over `wss://` in production.
- [ ] `CORS` configured to only allow the known dashboard origin, not `*`.
- [ ] Mobile app's `API_BASE_URL` in production build points to the HTTPS endpoint, not a dev HTTP one.

---

## 5. Data privacy

- [ ] `originDeviceId` is a hash, not a raw device identifier or phone number — avoid storing personally identifying information unless explicitly needed and consented to.
- [ ] Location data (a victim's exact coordinates) is sensitive — restrict dashboard access to authenticated dispatchers only, never expose a public "view all SOS events" endpoint.
- [ ] Define a data retention policy: how long resolved events are kept before archival/deletion, documented and communicated to users/partners.
- [ ] If operating in a region with specific data protection law (GDPR-like regimes, or local equivalents), review location-data handling against those requirements before public launch.

---

## 6. Rescue team account security

- [ ] Dispatcher/admin accounts use `bcrypt`-hashed passwords and require a reasonably strong password policy.
- [ ] Consider role separation: `admin` (can manage teams/users) vs `dispatcher` (can only view/assign events) — already reflected in the `role` field in `05-API-Schema.md`.
- [ ] FCM tokens stored per-team are only used for legitimate dispatch notifications — audit who can trigger a push (should be limited to the assign/resolve flow, not an arbitrary broadcast endpoint).

---

## 7. Mobile app hardening

- [ ] No secrets (API keys, HMAC signing keys) committed to the mobile repo in plaintext — use build-time injection + `react-native-encrypted-storage` for anything sensitive at runtime.
- [ ] Obfuscate/minify release builds to raise the bar against casual reverse engineering of the signing scheme.
- [ ] Confirm BLE permission prompts clearly explain purpose to the user (also required for app store approval, see `10-Deployment.md`).

---

## 8. Incident response readiness

- [ ] Have a documented process for revoking a compromised device's signing key/trust if abuse is detected.
- [ ] Backend logs (without storing excessive PII) sufficient to investigate a suspected spoofing or flooding incident after the fact.
- [ ] A manual override in the dashboard to mark an event `false_alarm` quickly, so a spoofed/erroneous event doesn't consume rescue attention indefinitely.

---

## 9. Pre-launch sign-off gate

Before any public/field deployment, confirm every checkbox above is either done or explicitly accepted as a known, documented limitation — this is a safety-relevant system, and "we'll fix it later" on security items should be a deliberate, written decision, not a default.
