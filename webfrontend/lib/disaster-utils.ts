
export function getInvestigationStatusStyle(
  inv: { assessment?: string | null; status: string }
): {
  ping: string;
  border: string;
  badge: string;
  dot: string;
  listBadge: string;
  label: string;
} {
  if (inv.assessment === "okay") {
    return {
      ping: "bg-emerald-400/40",
      border: "border-emerald-500",
      badge: "bg-emerald-600",
      dot: "bg-emerald-500",
      listBadge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "ALL OKAY",
    };
  }
  if (inv.assessment === "critical") {
    return {
      ping: "bg-red-400/40",
      border: "border-red-500",
      badge: "bg-red-600",
      dot: "bg-red-500",
      listBadge: "bg-red-50 text-red-700 border-red-200",
      label: "CRITICAL",
    };
  }
  if (inv.assessment === "need_more_team") {
    return {
      ping: "bg-orange-400/40",
      border: "border-orange-500",
      badge: "bg-orange-600",
      dot: "bg-orange-500",
      listBadge: "bg-orange-50 text-orange-700 border-orange-200",
      label: "NEED TEAM",
    };
  }
  return {
    ping: "bg-amber-400/40",
    border: "border-amber-500",
    badge: "bg-amber-600",
    dot: "bg-amber-500",
    listBadge: "bg-amber-50 text-amber-700 border-amber-200",
    label: "INVESTIGATING",
  };
}

export function getInvestigationDisplayStatus(
  status: string,
  assessment?: string | null
): string {
  if (status === "resolved" || status === "false_alarm")
    return "Investigated";
  if (status === "pending") return "Pending";
  if (assessment === "okay") return "All Okay";
  if (assessment === "critical") return "Critical";
  if (assessment === "need_more_team") return "Need More Team";
  return "Investigating";
}

export function getEventDateString(
  date?: string,
  createdTime?: string
): string {
  const eventDate = new Date(date || createdTime || "");
  return eventDate.toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getLocationString(
  city?: string,
  state?: string,
  lat?: number,
  lng?: number
): string {
  if (city || state) {
    return `${city || ""}${city && state ? ", " : ""}${state || ""}`;
  }
  if (lat !== undefined && lng !== undefined) {
    return `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`;
  }
  return "";
}
