# BLE Mesh SOS — Folder Structure

Paste this into a Claude Code / Codex session before asking it to generate new files, so generated code lands in the right place and stays consistent across sessions.

---

## 1. Full tree

```
ble-sos-system/
├── mobile-app/                      # React Native app
│   ├── src/
│   │   ├── ble/
│   │   │   ├── scanner.ts           # BLE central: scan for nearby packets
│   │   │   ├── advertiser.ts        # BLE peripheral: broadcast own packets (Android)
│   │   │   ├── relay.ts             # dedup cache + rebroadcast logic (01-Algorithms.md §1-2)
│   │   │   ├── codec.ts             # binary encode/decode (08-BLE-Protocol-Spec.md)
│   │   │   └── stateMachine.ts      # idle/relay-active/sos-triggered duty cycling
│   │   ├── screens/
│   │   │   ├── SosScreen.tsx        # main SOS button screen
│   │   │   ├── StatusScreen.tsx     # relay activity / mesh status view
│   │   │   └── SettingsScreen.tsx
│   │   ├── services/
│   │   │   ├── api.ts               # axios client, POST /api/sos etc (05-API-Schema.md)
│   │   │   ├── location.ts          # GPS capture wrapper
│   │   │   ├── storage.ts           # MMKV dedup cache wrapper
│   │   │   ├── connectivity.ts      # NetInfo gateway-detection
│   │   │   └── device.ts            # device ID, battery info
│   │   ├── store/
│   │   │   └── sosStore.ts          # zustand store
│   │   └── App.tsx
│   ├── android/                     # native Android project (permissions, foreground service)
│   ├── ios/                         # native iOS project (central-only scope)
│   ├── .env.example
│   └── package.json
│
├── backend/                          # Node.js API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── sos.routes.ts        # POST/GET/PATCH /api/sos
│   │   │   ├── teams.routes.ts      # /api/teams
│   │   │   └── auth.routes.ts       # /api/auth
│   │   ├── controllers/
│   │   │   ├── sos.controller.ts
│   │   │   ├── teams.controller.ts
│   │   │   └── auth.controller.ts
│   │   ├── services/
│   │   │   ├── sosService.ts        # dedup insert, nearest-team query (01-Algorithms.md §4-5)
│   │   │   ├── teamService.ts
│   │   │   └── pushService.ts       # firebase-admin FCM
│   │   ├── sockets/
│   │   │   └── index.ts             # socket.io setup, sos:new / sos:updated / team:updated
│   │   ├── queue/
│   │   │   ├── sosQueue.ts          # bullmq queue definition
│   │   │   └── sosWorker.ts         # worker pool processing ingestion jobs
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT verification
│   │   │   └── validate.ts          # zod schema validation
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # see 05-API-Schema.md §1
│   │   │   └── migrations/
│   │   └── index.ts                 # express app entrypoint
│   ├── .env.example
│   └── package.json
│
├── dashboard/                        # Next.js app
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx             # main map + event list view
│   │   │   ├── events/[id]/page.tsx # single event detail/assign view
│   │   │   └── teams/page.tsx       # rescue team roster
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── components/
│   │   ├── map/
│   │   │   ├── SosMap.tsx           # react-map-gl live pins
│   │   │   └── MapCluster.tsx
│   │   ├── events/
│   │   │   ├── EventList.tsx
│   │   │   ├── EventCard.tsx
│   │   │   └── AssignTeamDialog.tsx
│   │   └── ui/                      # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts                   # fetch wrappers matching 05-API-Schema.md
│   │   ├── socket.ts                # socket.io-client setup
│   │   └── auth.ts                  # next-auth config
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── BLE-SOS-Disaster-App-Docs.md
    ├── BLE-SOS-Algorithms-Memory-Design.md
    ├── 01-Algorithms.md
    ├── 02-Constants.md
    ├── 03-Memory.md
    ├── 04-Design.md
    ├── 05-API-Schema.md
    ├── 06-Setup-Env.md
    ├── 07-Folder-Structure.md   (this file)
    ├── 08-BLE-Protocol-Spec.md
    ├── 09-Testing-Checklist.md
    ├── 10-Deployment.md
    └── 11-Security-Checklist.md
```

---

## 2. Rule of thumb per folder (for AI-generated code placement)

| Folder | What goes here | What does NOT go here |
|---|---|---|
| `mobile-app/src/ble/` | Only BLE radio + protocol logic — no UI, no API calls | Screens, HTTP requests |
| `mobile-app/src/services/` | Anything talking to an external system (API, GPS, storage, connectivity) | BLE radio code, UI components |
| `backend/src/routes/` | Route definitions only — thin, just wiring HTTP methods to controllers | Business logic, DB queries |
| `backend/src/controllers/` | Request/response handling, calls into services | Raw SQL/Prisma calls directly (put in services) |
| `backend/src/services/` | Business logic, DB queries, dedup logic, nearest-team algorithm | Express req/res objects |
| `backend/src/queue/` | Only bullmq queue + worker definitions | Route handlers |
| `dashboard/components/` | Presentational + feature components | Data-fetching logic (put in `lib/`) |
| `dashboard/lib/` | API clients, socket setup, auth config | React components |

---

## 3. When asking Claude Code / Codex to generate a new file

Good prompt pattern:
> "Following `07-Folder-Structure.md`, create `backend/src/services/sosService.ts` implementing the dedup-insert logic from `01-Algorithms.md §5` and the nearest-team query from `01-Algorithms.md §4`, using the Prisma schema in `05-API-Schema.md §1`."

This keeps every session anchored to the same file locations and field names instead of drifting.
