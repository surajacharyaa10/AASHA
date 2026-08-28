# BLE Mesh SOS — Setup & Environment

How to get all three apps running locally. Paste this into a Claude Code / Codex session at the start of any setup or "why won't this run" task.

---

## 1. Prerequisites

| Tool | Version | Used by |
|---|---|---|
| Node.js | 20 LTS+ | backend, dashboard |
| npm or pnpm | latest | all |
| PostgreSQL | 15+ (with PostGIS extension available) | backend |
| Redis | 7+ | backend (bullmq queue) |
| React Native CLI + Android Studio | latest | mobile-app (Android build) |
| Xcode | latest (macOS only) | mobile-app (iOS build, central-only scope) |
| Physical Android devices (2+) | — | BLE testing — **BLE mesh cannot be meaningfully tested on emulators/simulators** |

---

## 2. Repo layout (see `07-Folder-Structure.md` for full detail)

```
ble-sos-system/
├── mobile-app/
├── backend/
├── dashboard/
└── docs/
```

---

## 3. Backend setup

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

**`.env.example`:**
```env
# Server
PORT=4000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ble_sos"

# Redis (bullmq queue)
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="change-me-in-production"
JWT_EXPIRY="8h"

# Firebase (push notifications to rescue teams)
FIREBASE_PROJECT_ID=""
FIREBASE_CLIENT_EMAIL=""
FIREBASE_PRIVATE_KEY=""

# CORS
DASHBOARD_ORIGIN="http://localhost:3000"
```

**Enable PostGIS (once, per database):**
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

## 4. Dashboard setup

```bash
cd dashboard
cp .env.example .env.local
npm install
npm run dev
```

**`.env.example`:**
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
NEXT_PUBLIC_WS_URL="http://localhost:4000"
NEXT_PUBLIC_MAPBOX_TOKEN=""
NEXTAUTH_SECRET="change-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Runs at `http://localhost:3000`.

---

## 5. Mobile app setup

```bash
cd mobile-app
npm install

# Android
npx react-native run-android

# iOS (macOS only, central/scanner role only — see 08-BLE-Protocol-Spec.md)
cd ios && pod install && cd ..
npx react-native run-ios
```

**`.env.example`:**
```env
API_BASE_URL="http://<your-backend-lan-ip>:4000"
```

> Use your machine's LAN IP, not `localhost`, when testing on a physical device — the phone can't reach your laptop's `localhost`.

**Required Android permissions** (already should be declared in `AndroidManifest.xml`, verify during setup):
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
```

---

## 6. Accounts/services you need to create

| Service | Why | Free tier OK for dev? |
|---|---|---|
| Mapbox (or Google Maps) | Dashboard map rendering | Yes |
| Firebase project | Push notifications to rescue team devices | Yes |
| Postgres + Redis | Can run locally via Docker for dev, see below | — |

**Quick local Docker option (Postgres + Redis) instead of native installs:**
```bash
docker run -d --name ble-sos-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ble_sos -p 5432:5432 postgis/postgis:15-3.4
docker run -d --name ble-sos-redis -p 6379:6379 redis:7
```

---

## 7. Running all three together (dev)

```bash
# terminal 1
cd backend && npm run dev

# terminal 2
cd dashboard && npm run dev

# terminal 3 — two physical Android phones needed, run app on each
cd mobile-app && npx react-native run-android --device
```

---

## 8. Common setup issues

| Symptom | Cause | Fix |
|---|---|---|
| Mobile app can't reach backend | Used `localhost` in `API_BASE_URL` | Use your machine's LAN IP instead |
| BLE scan finds nothing on emulator | BLE mesh requires physical devices | Test on 2+ real Android phones |
| Dashboard map blank | Missing/invalid Mapbox token | Check `NEXT_PUBLIC_MAPBOX_TOKEN` |
| Prisma migrate fails | PostGIS extension not enabled | Run `CREATE EXTENSION IF NOT EXISTS postgis;` manually first |
| WebSocket not connecting from dashboard | CORS origin mismatch | Check `DASHBOARD_ORIGIN` in backend `.env` matches dashboard's actual URL |
