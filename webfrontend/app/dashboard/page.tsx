"use client";

import { useState, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import {
  Radio,
  Users,
  Clock,
  RefreshCw,
  Bell,
  Filter,
  Plus,
  Minus,
  LocateFixed,
  AlertCircle,
  UserCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import SosEventDetail, {
  SosEvent,
  SosStatus,
} from "@/app/components/SOSDetails";

const INITIAL_SOS_EVENTS: SosEvent[] = [
  {
    id: "SOS-NEP-0842",
    place: "Lukla, Solukhumbu",
    region: "Khumbu",
    status: "pending",
    meta: "Received 14:27 · 2.8 km from Team Echo",
    priorityLabel: "Priority 1 · Immediate Review",
    battery: 38,
    meshHops: 4,
    receivedTime: "14:27",
    receivedDate: "28 Aug · NPT",
    accuracy: "±18m",
    lat: 27.6869,
    lng: 86.7314,
    elevation: 2860,
    terrainLabel: "Lukla east ridge · marked SOS location",
    callerNote:
      "Two trekkers separated near the east ridge. One has a suspected ankle injury. Weather is closing in; visibility is falling rapidly.",
    suggestedTeam: {
      name: "Team Echo",
      station: "Lukla Station · 2.8 km away",
      status: "Available",
      eta: "18 min",
      capabilities: "Rope Rescue · Trauma Care",
    },
  },
  {
    id: "SOS-NEP-0840",
    place: "Pheriche, Khumbu",
    region: "Khumbu",
    status: "assigned",
    meta: "Team Himal assigned · 14:11",
    priorityLabel: "Priority 2 · Unit En Route",
    battery: 72,
    meshHops: 2,
    receivedTime: "14:11",
    receivedDate: "28 Aug · NPT",
    accuracy: "±12m",
    lat: 27.8942,
    lng: 86.8219,
    elevation: 4240,
    terrainLabel: "Pheriche valley medical trail",
    callerNote:
      "Solo mountaineer showing acute pulmonary symptoms (HAPE). Team Himal deployed with oxygen bottles and portable stretcher.",
    assignedTeam: "Team Himal",
    suggestedTeam: {
      name: "Team Himal",
      station: "Namche Station · 4.1 km away",
      status: "Deployed",
      eta: "12 min",
      capabilities: "High Altitude · Medical Care",
    },
  },
  {
    id: "SOS-NEP-0837",
    place: "Namche Bazaar",
    region: "Khumbu",
    status: "resolved",
    meta: "Closed by Team Sagarmatha · 13:56",
    priorityLabel: "Resolved · Mission Complete",
    battery: 85,
    meshHops: 1,
    receivedTime: "13:56",
    receivedDate: "28 Aug · NPT",
    accuracy: "±5m",
    lat: 27.8069,
    lng: 86.7139,
    elevation: 3440,
    terrainLabel: "Namche market bypass path",
    callerNote:
      "Lost trekker found by local search patrol and guided back to safe lodge. Medical triage completed with no major injuries.",
    assignedTeam: "Team Sagarmatha",
    suggestedTeam: {
      name: "Team Sagarmatha",
      station: "Phaplu Station",
      status: "Available",
      eta: "Completed",
      capabilities: "Evacuation · Search",
    },
  },
];

const MAP_CENTER = { lat: 27.94, lng: 86.79 }; // Khumbu region

const STATUS_STYLES: Record<
  SosStatus,
  { dot: string; badgeBg: string; badgeText: string; ring: string }
> = {
  pending: {
    dot: "bg-red-500",
    badgeBg: "bg-red-50 border border-red-200",
    badgeText: "text-red-700",
    ring: "border-red-400 ring-2 ring-red-100",
  },
  assigned: {
    dot: "bg-amber-500",
    badgeBg: "bg-amber-50 border border-amber-200",
    badgeText: "text-amber-700",
    ring: "border-amber-400 ring-2 ring-amber-100",
  },
  resolved: {
    dot: "bg-emerald-500",
    badgeBg: "bg-emerald-50 border border-emerald-200",
    badgeText: "text-emerald-700",
    ring: "border-emerald-400 ring-2 ring-emerald-100",
  },
};

function StatCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${accent ?? "text-slate-900"}`}>{value}</span>
        </div>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: SosStatus }) {
  const s = STATUS_STYLES[status];
  const label = status[0].toUpperCase() + status.slice(1);
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badgeBg} ${s.badgeText}`}>
      {label}
    </span>
  );
}

function EventCard({
  event,
  active,
  onClick,
}: {
  event: SosEvent;
  active?: boolean;
  onClick?: () => void;
}) {
  const s = STATUS_STYLES[event.status];
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl border bg-white p-4 text-left shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50/60 ${
        active ? s.ring : "border-slate-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {event.id}
          </span>
        </div>
        <StatusPill status={event.status} />
      </div>
      <p className="text-sm font-medium text-slate-700">{event.place}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{event.meta}</span>
        <span className="flex items-center text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          View details <ChevronRight className="h-3 w-3 ml-0.5" />
        </span>
      </div>
    </button>
  );
}

// Pulsing marker rendered as a plain DOM element inside AdvancedMarker
function SosMarker({
  status,
  onClick,
}: {
  status: SosStatus;
  onClick?: () => void;
}) {
  if (status === "resolved") {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
      >
        <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "assigned") {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 shadow-lg shadow-amber-400/30"
      >
        <UserCheck className="h-5 w-5 text-slate-900" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center"
    >
      <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-red-500/20" />
      <span className="absolute inline-flex h-11 w-11 rounded-full bg-red-500/25" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/40">
        <AlertCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [events, setEvents] = useState<SosEvent[]>(INITIAL_SOS_EVENTS);
  const [tab, setTab] = useState<SosStatus>("pending");
  const [selectedSosEvent, setSelectedSosEvent] = useState<SosEvent | null>(null);

  const counts = useMemo(
    () => ({
      pending: events.filter((e) => e.status === "pending").length,
      assigned: events.filter((e) => e.status === "assigned").length,
      resolved: events.filter((e) => e.status === "resolved").length,
    }),
    [events]
  );

  const filtered = events.filter((e) => e.status === tab);

  const handleAssignTeam = (eventId: string, teamName: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: "assigned",
              assignedTeam: teamName,
              meta: `${teamName} assigned · Just now`,
            }
          : e
      )
    );
  };

  const handleResolveEvent = (eventId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              status: "resolved",
              meta: `Closed & resolved · Just now`,
            }
          : e
      )
    );
  };

  // If user clicked on an SOS event, show the full SOS Event Detail view
  if (selectedSosEvent) {
    const freshEvent = events.find((e) => e.id === selectedSosEvent.id) ?? selectedSosEvent;
    return (
      <SosEventDetail
        event={freshEvent}
        onBack={() => setSelectedSosEvent(null)}
        onAssignTeam={handleAssignTeam}
        onResolve={handleResolveEvent}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xs">
            <Radio className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide text-slate-900">AASHA</p>
          </div>
          <div className="ml-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Network stable · 14:32 NPT
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" />
            Live sync
          </button>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
            RK
          </div>
        </div>
      </header>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-3">
        <StatCard
          icon={<AlertCircle className="h-5 w-5 text-red-600" />}
          iconBg="bg-red-50"
          label="Active SOS"
          value={events.length}
          sub={<span className="font-semibold text-red-600">+3 last hour</span>}
        />
        <StatCard
          icon={<Users className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Teams deployed"
          value="08"
          sub="of 14 available"
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Avg response time"
          value="06:24"
          sub="minutes"
        />
      </div>

      {/* ── Body: sidebar + map ────────────────────────────── */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* Sidebar: SOS Event Queue */}
        <aside className="flex w-[340px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">SOS Event Queue</h2>
              <p className="text-xs text-slate-500">{events.length} requiring coordination</p>
            </div>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
              <Filter className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex gap-2">
            {(["pending", "assigned", "resolved"] as SosStatus[]).map((s) => {
              const isActive = tab === s;
              return (
                <button
                  key={s}
                  onClick={() => setTab(s)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? s === "pending"
                        ? "bg-red-600 text-white shadow-xs"
                        : "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {s[0].toUpperCase() + s.slice(1)} {counts[s]}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto">
            {filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedSosEvent(event)}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-400">No {tab} events.</p>
            )}
          </div>
        </aside>

        {/* Map */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}>
            <Map
              defaultCenter={MAP_CENTER}
              defaultZoom={11}
              mapId="aasha-ops-map"
              disableDefaultUI
              className="h-full w-full"
            >
              {events.map((event) => (
                <AdvancedMarker
                  key={event.id}
                  position={{ lat: event.lat, lng: event.lng }}
                  onClick={() => setSelectedSosEvent(event)}
                >
                  <SosMarker
                    status={event.status}
                    onClick={() => setSelectedSosEvent(event)}
                  />
                </AdvancedMarker>
              ))}
            </Map>
          </APIProvider>

          {/* Floating region label */}
          <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
            <p className="text-xs font-medium text-slate-500">Live operational map</p>
            <p className="text-sm font-bold text-slate-900">Khumbu region · 27.98° N, 86.92° E</p>
          </div>

          {/* Zoom / locate controls */}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
              <Plus className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
              <Minus className="h-4 w-4" />
            </button>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50">
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white/95 px-5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500" /> Pending
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400" /> Assigned
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> Resolved
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}