# BLE Mesh SOS — Deployment

Where things get hosted, and the app store considerations specific to a background-BLE + location app.

---

## 1. Backend deployment

| Component | Suggested option | Notes |
|---|---|---|
| API server (Node.js/Express) | Railway, Render, Fly.io, or a VPS (DigitalOcean/AWS EC2) | Needs to stay warm for WebSocket connections — avoid serverless functions for the Socket.io layer specifically |
| PostgreSQL | Managed Postgres (Railway, Supabase, RDS, Neon) with PostGIS enabled | Confirm the provider supports enabling the PostGIS extension |
| Redis | Managed Redis (Upstash, Railway, ElastiCache) | Used by `bullmq` for ingestion queue |
| WebSocket scaling | Socket.io Redis adapter | Needed once you run more than one backend instance, so all instances share broadcast state |

**Environment variables to set in production** (see `06-Setup-Env.md` for full list): `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` (strong, unique), `FIREBASE_*`, `DASHBOARD_ORIGIN` (production dashboard URL, not localhost).

**Health checks:** expose a `GET /health` endpoint checking DB + Redis connectivity, for your hosting provider's uptime monitor.

---

## 2. Dashboard deployment

| Component | Suggested option | Notes |
|---|---|---|
| Next.js app | Vercel (simplest) or same host as backend | Set `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_WS_URL` to production backend URL |
| Mapbox token | Restrict to production domain in Mapbox dashboard | Prevents token abuse |

---

## 3. Mobile app — Android deployment

1. Generate a signed release build (`android/app/build.gradle` release config + keystore).
2. Submit to Google Play Console.
3. **Play Store review will scrutinize:**
   - Background location access — you'll need to complete Google's [Background Location permission declaration form](https://support.google.com/googleplay/android-developer/answer/9799150) explaining the disaster-SOS use case clearly.
   - Foreground service usage — declare the `FOREGROUND_SERVICE_LOCATION` type and justify it in the listing (keeping BLE relay alive).
   - Bluetooth permissions — explain nearby-device scanning is for offline mesh relay, not tracking/advertising.
4. Provide a clear in-app privacy disclosure screen before requesting BLE + location permissions (improves both review approval odds and user trust).

---

## 4. Mobile app — iOS deployment

1. Xcode archive + App Store Connect submission.
2. **App Store review will scrutinize:**
   - `NSBluetoothAlwaysUsageDescription` and `NSLocationWhenInUseUsageDescription` / `NSLocationAlwaysAndWhenInUseUsageDescription` strings must clearly explain the disaster-SOS relay purpose.
   - Given iOS's background peripheral restrictions (see `08-BLE-Protocol-Spec.md §5`), be accurate in your App Store description about iOS's reduced relay role — don't overclaim full mesh parity with Android.
3. Expect closer scrutiny than a typical consumer app given the location + Bluetooth + emergency framing — budget extra review time, and consider reaching out to Apple's review team proactively with context for a sensitive-use-case app.

---

## 5. Staged rollout plan

| Stage | Scope |
|---|---|
| Internal testing | Team + a handful of physical devices, backend on a dev/staging environment |
| Closed pilot | Partner with a local disaster-response org or university for a supervised field test (see `09-Testing-Checklist.md §9`) |
| Public beta | Regional rollout, monitor backend load and false-trigger rates closely |
| General availability | Full store listing, after security review (`11-Security-Checklist.md`) is complete |

---

## 6. Monitoring in production

- **Backend:** error tracking (Sentry), uptime monitoring on `/health`, Redis queue depth alerting (see `02-Constants.md` threshold).
- **Dashboard:** basic analytics on dispatcher usage, WebSocket connection count.
- **Mobile:** crash reporting (Sentry or Firebase Crashlytics) — critical for a safety-relevant app where silent crashes on the SOS path are unacceptable.

---

## 7. Backup & disaster recovery (for the disaster-response system itself)

- Automated daily Postgres backups, tested restore process.
- Document a fallback manual dispatch process (phone/radio) in case the backend itself goes down during a real event — this system should degrade to "existing manual process," never leave rescue coordination fully blocked.
