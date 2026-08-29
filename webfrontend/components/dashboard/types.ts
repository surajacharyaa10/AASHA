import type { SosStatus } from "@/app/components/SOSDetails";
import BACKEND_URL from "@/lib/config";

export const BACKEND = BACKEND_URL;
export const MAP_CENTER = { lat: 27.94, lng: 86.79 };


export const STATUS_STYLES: Record<
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

export function mapApiEventToSosEvent(apiEvent: any) {
  const reportedDate = new Date(apiEvent.reportedAt);
  const timeStr = reportedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = reportedDate.toLocaleDateString([], { day: "2-digit", month: "short" });
  return {
    id: apiEvent.packetId || apiEvent.id,
    place:
      typeof apiEvent.latitude === "number" && typeof apiEvent.longitude === "number"
        ? apiEvent.latitude === 27.6869
          ? "Lukla, Solukhumbu"
          : `Lat: ${apiEvent.latitude.toFixed(4)}, Lng: ${apiEvent.longitude.toFixed(4)}`
        : "Unknown Location",
    region: "Khumbu",
    status: apiEvent.status || "pending",
    meta: `Received ${timeStr} · ${apiEvent.hopCount || 0} hops`,
    priorityLabel:
      apiEvent.status === "pending"
        ? "Priority 1 · Immediate Review"
        : apiEvent.status === "assigned"
        ? "Priority 2 · Unit En Route"
        : "Resolved · Mission Complete",
    battery: apiEvent.battery ?? 100,
    meshHops: apiEvent.hopCount || 0,
    receivedTime: timeStr,
    receivedDate: `${dateStr} · NPT`,
    accuracy: "±15m",
    lat: apiEvent.latitude != null ? Number(apiEvent.latitude) : undefined,
    lng: apiEvent.longitude != null ? Number(apiEvent.longitude) : undefined,
    elevation: 2860,
    terrainLabel: "marked SOS location",
    callerNote:
      apiEvent.note && apiEvent.note.trim().length > 0 ? apiEvent.note.trim() : "Nothing",
    name: apiEvent.name ?? undefined,
    address: apiEvent.address ?? undefined,
    email: apiEvent.email ?? undefined,
    phone: apiEvent.phone ?? undefined,
    bloodGroup: apiEvent.bloodGroup ?? undefined,
    assignedTeam: apiEvent.assignedTeamName ?? null,
    // suggestedTeam is populated live from /api/dispatch/nearest — no hardcoded fallback
    suggestedTeam: undefined,
  };
}
