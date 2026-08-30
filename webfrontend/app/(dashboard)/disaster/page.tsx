
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";

import { Map, Overlay, GeoJson } from "pigeon-maps";
import {
  Plus,
  Minus,
  LocateFixed,
  AlertTriangle,
  RefreshCw,
  Shield,
  Globe,
  Search,
  UserPlus,
  Loader2,
  Clock3,
  SlidersHorizontal,
  X,
} from "lucide-react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DisasterMarker } from "@/components/disaster/DisasterMarker";

const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };

const BACKEND =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface DisasterEvent {
  event_id: string;
  event_type: string;
  event_name: string;
  city: string;
  state: string;
  country_code: string;
  lat: number;
  lng: number;
  date: string;
  alert_level: string;
  proximity_severity_level: string;
  details: Record<string, unknown>;
  end_date: string;
  created_time: string;
  source_event_id: string;
}

interface GeometryResponse {
  message?: string;
  result?: Array<{
    geometry?: {
      coordinates?: number[][][];
    };
  }>;
}

interface Investigation {
  id: string;
  disasterEventId: string;
  disasterName: string;
  location: string;
  status: string;
  assessment?: string;
  assignedTeamName?: string;
  lat: number;
  lng: number;
}

interface NearestTeam {
  teamName: string;
  district: string;
  province: string;
  distanceKm: number;
  etaMinutes: number;
  leadName: string;
  leadPhone: string;
}

type TimeRange = 7 | 15 | 30 | null;

const TIME_RANGES: {
  value: TimeRange;
  label: string;
  description: string;
}[] = [
  {
    value: 7,
    label: "7D",
    description: "Last 7 days",
  },
  {
    value: 15,
    label: "15D",
    description: "Last 15 days",
  },
  {
    value: 30,
    label: "30D",
    description: "Last 30 days",
  },
  {
    value: null,
    label: "ALL",
    description: "All available events",
  },
];

const EVENT_TYPES = [
  "All",
  "EQ",
  "FL",
  "WF",
  "SW",
  "VO",
  "DR",
  "TC",
  "LS",
  "ET",
  "TN",
];

const EVENT_TYPE_COLORS: Record<string, string> = {
  WF: "bg-red-100 text-red-700 border-red-200",
  TN: "bg-blue-100 text-blue-700 border-blue-200",
  EQ: "bg-amber-100 text-amber-700 border-amber-200",
  TC: "bg-cyan-100 text-cyan-700 border-cyan-200",
  FL: "bg-sky-100 text-sky-700 border-sky-200",
  ET: "bg-orange-100 text-orange-700 border-orange-200",
  DR: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SW: "bg-slate-100 text-slate-700 border-slate-200",
  SI: "bg-sky-100 text-sky-700 border-sky-200",
  VO: "bg-red-100 text-red-800 border-red-200",
  LS: "bg-stone-100 text-stone-700 border-stone-200",
  Misc: "bg-gray-100 text-gray-700 border-gray-200",
};

function getInvestigationStatusStyle(
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

function getInvestigationDisplayStatus(
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

export default function DisasterPage() {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDisaster, setSelectedDisaster] =
    useState<DisasterEvent | null>(null);

  const [polygon, setPolygon] = useState<[number, number][] | null>(null);
  const [loadingPolygon, setLoadingPolygon] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>([
    NEPAL_CENTER.lat,
    NEPAL_CENTER.lng,
  ]);

  const [mapZoom, setMapZoom] = useState(7);

  const [investigating, setInvestigating] = useState(false);

  const [nearestTeam, setNearestTeam] =
    useState<NearestTeam | null>(null);

  const [investigationId, setInvestigationId] =
    useState<string | null>(null);

  const [investigationStatus, setInvestigationStatus] =
    useState<string | null>(null);

  const [investigations, setInvestigations] =
    useState<Investigation[]>([]);

  const detailInvestigation = investigationId
    ? investigations.find((inv) => inv.id === investigationId)
    : null;
  const currentInvestigationStatus =
    detailInvestigation?.status || investigationStatus || "investigating";
  const currentAssessment = detailInvestigation?.assessment;
  const isInvestigationComplete =
    currentInvestigationStatus === "resolved" ||
    currentInvestigationStatus === "false_alarm";

  const [timeRange, setTimeRange] = useState<TimeRange>(7);

  const [eventTypeFilter, setEventTypeFilter] =
    useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const fetchInvestigations = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/investigations`);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      setInvestigations(data.investigations || []);
    } catch (err) {
      console.error("Failed to fetch investigations:", err);
    }
  }, []);

  const fetchDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const daysParam =
        timeRange === null ? "" : `&days=${timeRange}`;

      const typeParam = eventTypeFilter
        ? `&eventType=${encodeURIComponent(eventTypeFilter)}`
        : "";

      const res = await fetch(
        `${BACKEND}/api/disasters/latest/by-country-code?countryCode=NPL&limit=200&page=1${daysParam}${typeParam}`
      );

      if (!res.ok) {
        setError(
          `Unable to load disasters (HTTP ${res.status}). The disaster data provider may be rate-limiting requests.`
        );

        setDisasters([]);
        return;
      }

      const data = await res.json();

      const events = Array.isArray(data?.result)
        ? data.result
        : [];

      setDisasters(events as DisasterEvent[]);
    } catch (err) {
      console.error("Failed to fetch disasters:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch disaster data"
      );

      setDisasters([]);
    } finally {
      setLoading(false);
    }
  }, [timeRange, eventTypeFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchDisasters, 0);

    return () => clearTimeout(timer);
  }, [fetchDisasters]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/investigations`);

        if (!res.ok) return;

        const data = await res.json();
        const invs = data.investigations || [];

        if (mounted) {
          setInvestigations(invs);
        }
      } catch (err) {
        console.error(
          "Failed to fetch investigations:",
          err
        );
      }
    };

    load();

    const interval = setInterval(load, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const fetchPolygon = async (sourceEventId: string) => {
    setLoadingPolygon(true);
    setPolygon(null);

    try {
      const res = await fetch(
        `${BACKEND}/api/disasters/geometry/by-source-eventId?sourceEventId=${sourceEventId}`
      );

      if (!res.ok) {
        console.error(
          "Failed to fetch disaster polygon:",
          res.status
        );

        setPolygon(null);
        return;
      }

      const data = (await res.json()) as GeometryResponse;

      const geometry = data?.result?.[0]?.geometry;
      const coordinates = geometry?.coordinates;

      if (coordinates && coordinates.length > 0) {
        const outerRing = coordinates[0];

        const converted: [number, number][] = outerRing
          .filter(
            (pt): pt is [number, number] =>
              Array.isArray(pt) && pt.length >= 2
          )
          .map(([lng, lat]) => [lat, lng]);

        setPolygon(converted);
      } else {
        setPolygon(null);
      }
    } catch (err) {
      console.error(
        "Failed to fetch polygon:",
        err
      );

      setPolygon(null);
    } finally {
      setLoadingPolygon(false);
    }
  };

  const handleSelectDisaster = (
    disaster: DisasterEvent
  ) => {
    setSelectedDisaster(disaster);

    if (
      disaster.source_event_id &&
      !disaster.source_event_id.startsWith("EONET-") &&
      !disaster.source_event_id.startsWith("GDACS-")
    ) {
      fetchPolygon(disaster.source_event_id);
    } else {
      setPolygon(null);
    }

    setInvestigating(false);
    setNearestTeam(null);
    setInvestigationId(null);
    setInvestigationStatus(null);
  };

  const handleInvestigate = async () => {
    if (!selectedDisaster) return;

    setInvestigating(true);
    setNearestTeam(null);

    try {
      const res = await fetch(
        `${BACKEND}/api/investigations/nearest-team?lat=${selectedDisaster.lat}&lng=${selectedDisaster.lng}`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.team) {
        setNearestTeam(data.team);
      } else {
        setNearestTeam(null);
      }
    } catch (err) {
      console.error(
        "Failed to find nearest team:",
        err
      );

      setNearestTeam(null);
    } finally {
      setInvestigating(false);
    }
  };

  const handleAssignInvestigation = async () => {
    if (!selectedDisaster || !nearestTeam) return;

    try {
      const createRes = await fetch(
        `${BACKEND}/api/investigations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            disasterEventId: selectedDisaster.event_id,
            disasterName: selectedDisaster.event_name,
            lat: selectedDisaster.lat,
            lng: selectedDisaster.lng,
            location: [
              selectedDisaster.city,
              selectedDisaster.state,
              selectedDisaster.country_code,
            ]
              .filter(Boolean)
              .join(", "),
          }),
        }
      );

      if (!createRes.ok) {
        throw new Error(`HTTP ${createRes.status}`);
      }

      const created = await createRes.json();

      setInvestigationId(created.id);

      const assignRes = await fetch(
        `${BACKEND}/api/investigations/${created.id}/assign`,
        {
          method: "POST",
        }
      );

      if (!assignRes.ok) {
        throw new Error(`HTTP ${assignRes.status}`);
      }

      const assigned = await assignRes.json();

      setInvestigationStatus(
        assigned.investigation?.status ||
          "investigating"
      );

      setNearestTeam(null);

      fetchInvestigations();
    } catch (err) {
      console.error(
        "Failed to assign investigation:",
        err
      );
    }
  };

  const filteredDisasters = useMemo(() => {
    if (!eventTypeFilter) return disasters;

    return disasters.filter(
      (d) => d.event_type === eventTypeFilter
    );
  }, [disasters, eventTypeFilter]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};

    filteredDisasters.forEach((d) => {
      byType[d.event_type] =
        (byType[d.event_type] || 0) + 1;
    });

    return {
      total: filteredDisasters.length,
      byType,
    };
  }, [filteredDisasters]);

  const activeFilterCount =
    (timeRange !== 7 ? 1 : 0) +
    (eventTypeFilter ? 1 : 0);

  const clearFilters = () => {
    setTimeRange(7);
    setEventTypeFilter(null);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 border-slate-200"
            >
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </Button>
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Real-Time Disaster Monitor — Nepal
              </h1>

              <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                Live
              </span>
            </div>

            <p className="text-xs font-medium text-slate-500">
              {loading
                ? "Fetching latest disaster data…"
                : `Updated ${new Date().toLocaleTimeString()} · ${filteredDisasters.length} active events in Nepal ${
                    eventTypeFilter
                      ? `· ${eventTypeFilter}`
                      : ""
                  } ${
                    timeRange === null
                      ? "(all time)"
                      : `(last ${timeRange} days)`
                  }`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* ========================= */}
          {/* MODERN FILTER BAR */}
          {/* ========================= */}

          <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm lg:flex">
            {/* Time range */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <div className="flex items-center gap-1.5 px-2 text-slate-500">
                <Clock3 className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Time
                </span>
              </div>

              {TIME_RANGES.map((range) => {
                const active = timeRange === range.value;

                return (
                  <button
                    key={String(range.value)}
                    onClick={() =>
                      setTimeRange(range.value)
                    }
                    title={range.description}
                    className={`
                      rounded-lg px-3.5 py-2 text-xs font-bold
                      transition-all duration-200
                      ${
                        active
                          ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-900"
                      }
                    `}
                  >
                    {range.label}
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-slate-200" />

            {/* Event types */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              <div className="flex items-center gap-1.5 px-2 text-slate-500">
                <SlidersHorizontal className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Type
                </span>
              </div>

              {EVENT_TYPES.map((type) => {
                const active =
                  type === "All"
                    ? eventTypeFilter === null
                    : eventTypeFilter === type;

                const colorClass =
                  EVENT_TYPE_COLORS[type] ||
                  "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <button
                    key={type}
                    onClick={() =>
                      setEventTypeFilter(
                        type === "All" ? null : type
                      )
                    }
                    title={
                      type === "All"
                        ? "Show all event types"
                        : `Show ${type} events`
                    }
                    className={`
                      rounded-lg border px-3 py-2
                      text-[11px] font-bold uppercase
                      transition-all duration-200
                      ${
                        active
                          ? type === "All"
                            ? "border-slate-300 bg-white text-slate-900 shadow-md"
                            : `${colorClass} shadow-md`
                          : "border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-900"
                      }
                    `}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <>
                <div className="h-8 w-px bg-slate-200" />

                <button
                  onClick={clearFilters}
                  className="group flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                >
                  <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
                  Clear
                </button>
              </>
            )}
          </div>

          {/* Mobile filter button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="relative gap-2 border-slate-200 font-semibold text-slate-700 lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters

            {activeFilterCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchDisasters}
            className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">
              Refresh
            </span>
          </Button>
        </div>
      </header>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="border-b border-slate-200 bg-white px-6 py-3 shadow-sm lg:hidden">
          <div className="flex flex-col gap-3">
            {/* Mobile time filter */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Time Range
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 rounded-xl bg-slate-100 p-1">
                {TIME_RANGES.map((range) => {
                  const active =
                    timeRange === range.value;

                  return (
                    <button
                      key={String(range.value)}
                      onClick={() =>
                        setTimeRange(range.value)
                      }
                      className={`
                        rounded-lg px-3 py-2 text-xs font-bold
                        ${
                          active
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500"
                        }
                      `}
                    >
                      {range.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile event filter */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Event Type
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.map((type) => {
                  const active =
                    type === "All"
                      ? eventTypeFilter === null
                      : eventTypeFilter === type;

                  return (
                    <button
                      key={type}
                      onClick={() =>
                        setEventTypeFilter(
                          type === "All" ? null : type
                        )
                      }
                      className={`
                        rounded-lg border px-3 py-1.5 text-[10px]
                        font-bold uppercase transition-all
                        ${
                          active
                            ? type === "All"
                              ? "border-slate-300 bg-slate-900 text-white"
                              : EVENT_TYPE_COLORS[type]
                            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                        }
                      `}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600"
              >
                <X className="h-3.5 w-3.5" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Active Disasters
            </p>
            <span className="text-2xl font-bold text-slate-900">
              {stats.total}
            </span>
            <p className="text-xs text-slate-500">
              in Nepal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Nearby Events
            </p>

            <span className="text-2xl font-bold text-slate-900">
              {filteredDisasters.length}
            </span>

            <p className="text-xs text-slate-500">
              regional
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:col-span-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>

          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">
              Event Types Active
            </p>

            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(stats.byType).map(
                ([type, count]) => (
                  <span
                    key={type}
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                      EVENT_TYPE_COLORS[type] ||
                      "border-gray-200 bg-gray-100 text-gray-700"
                    }`}
                  >
                    {type}: {count}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* Disaster list */}
        <div className="w-80 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">
              Disaster Events
            </h2>

            <p className="text-xs text-slate-500">
              {filteredDisasters.length} events in Nepal
            </p>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map(
                (_, i) => (
                  <div
                    key={i}
                    className="space-y-2"
                  >
                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                  </div>
                )
              )}
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-red-600">
              {error}
            </div>
          ) : filteredDisasters.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <Shield className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              No active disasters detected in Nepal
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredDisasters.map((disaster) => {
                const eventDate = new Date(
                  disaster.date ||
                    disaster.created_time
                );

                const timeStr =
                  eventDate.toLocaleDateString(
                    [],
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  );

                const isSelected =
                  selectedDisaster?.event_id ===
                  disaster.event_id;

                const colorClass =
                  EVENT_TYPE_COLORS[
                    disaster.event_type
                  ] ||
                  EVENT_TYPE_COLORS["Misc"];

                return (
                  <button
                    key={disaster.event_id}
                    onClick={() =>
                      handleSelectDisaster(disaster)
                    }
                    className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${
                      isSelected
                        ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                        : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold text-slate-900">
                          {disaster.event_name ||
                            disaster.event_type}
                        </p>

                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {disaster.city ||
                          disaster.state
                            ? `${disaster.city || ""}${
                                disaster.city &&
                                disaster.state
                                  ? ", "
                                  : ""
                              }${
                                disaster.state || ""
                              }`
                            : `${disaster.lat.toFixed(
                                2
                              )}°N, ${disaster.lng.toFixed(
                                2
                              )}°E`}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colorClass}`}
                      >
                        {disaster.event_type}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="font-medium">
                        {timeStr}
                      </span>

                      {disaster.alert_level && (
                        <span
                          className={`font-semibold capitalize ${
                            disaster.alert_level ===
                              "Red" ||
                            disaster.alert_level ===
                              "Orange"
                              ? "text-red-600"
                              : disaster.alert_level ===
                                "Yellow"
                              ? "text-amber-600"
                              : "text-slate-500"
                          }`}
                        >
                          {disaster.alert_level} alert
                        </span>
                      )}
                    </div>

                      {(() => {
                        const activeInv =
                          investigations.find(
                            (inv) =>
                              inv.disasterEventId ===
                                disaster.event_id &&
                              (inv.status ===
                                "investigating" ||
                                inv.status === "pending")
                          );

                        if (!activeInv) return null;

                        const invStyle =
                          getInvestigationStatusStyle(activeInv);

                        return (
                          <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${invStyle.listBadge}`}>
                              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${invStyle.dot}`} />
                              {invStyle.label}
                            </span>

                            {activeInv.assignedTeamName && (
                              <span className="text-[11px] font-medium text-slate-600">
                              ·{" "}
                              {
                                activeInv.assignedTeamName
                              }
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            onBoundsChanged={({ center, zoom }) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
          >
            {filteredDisasters.map((disaster) => {
              const activeInv =
                investigations.find(
                  (inv) =>
                    inv.disasterEventId ===
                      disaster.event_id &&
                    (inv.status === "investigating" ||
                      inv.status === "pending")
                );

              if (activeInv) {
                const invStyle = getInvestigationStatusStyle(activeInv);
                return (
                  <Overlay
                    key={disaster.event_id}
                    anchor={[
                      disaster.lat,
                      disaster.lng,
                    ]}
                    offset={[16, 32]}
                  >
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`absolute h-16 w-16 animate-ping rounded-full ${invStyle.ping}`}
                        style={{
                          animationDuration:
                            activeInv.assessment === "critical"
                              ? "1s"
                              : "2s",
                        }}
                      />

                      <div className={`relative h-10 w-10 overflow-hidden rounded-full border-[3px] ${invStyle.border} shadow-lg backdrop-blur-sm`}>
                        <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
                          <DisasterMarker
                            eventType={
                              disaster.event_type
                            }
                            severity={
                              disaster.proximity_severity_level
                            }
                          />
                        </div>
                      </div>

                      <div className={`absolute -bottom-5 whitespace-nowrap rounded-full ${invStyle.badge} px-2 py-0.5 text-[9px] font-bold text-white shadow-md`}>
                        {invStyle.label}
                      </div>
                    </div>
                  </Overlay>
                );
              }

              return (
                <Overlay
                  key={disaster.event_id}
                  anchor={[
                    disaster.lat,
                    disaster.lng,
                  ]}
                  offset={[16, 32]}
                >
                  <div
                    onClick={() =>
                      handleSelectDisaster(disaster)
                    }
                    className="cursor-pointer"
                  >
                    <DisasterMarker
                      eventType={
                        disaster.event_type
                      }
                      severity={
                        disaster.proximity_severity_level
                      }
                      onClick={() =>
                        handleSelectDisaster(disaster)
                      }
                    />
                  </div>
                </Overlay>
              );
            })}

            {polygon &&
              polygon.length > 1 &&
              (() => {
                const coords = polygon.map(
                  ([lat, lng]) =>
                    [lng, lat] as [
                      number,
                      number
                    ]
                );

                if (
                  coords[0] &&
                  (coords[0][0] !==
                    coords[coords.length - 1]?.[0] ||
                    coords[0][1] !==
                      coords[coords.length - 1]?.[1])
                ) {
                  coords.push(coords[0]);
                }

                const geoJsonData = {
                  type: "Feature" as const,
                  geometry: {
                    type: "Polygon" as const,
                    coordinates: [coords],
                  },
                };

                const isHighAlert =
                  selectedDisaster?.alert_level ===
                    "Red" ||
                  selectedDisaster?.alert_level ===
                    "Orange";

                return (
                  <GeoJson
                    data={geoJsonData}
                    svgAttributes={{
                      fill: isHighAlert
                        ? "rgba(220, 38, 38, 0.25)"
                        : "rgba(245, 158, 11, 0.25)",
                      stroke: isHighAlert
                        ? "rgba(220, 38, 38, 0.8)"
                        : "rgba(245, 158, 11, 0.8)",
                      strokeWidth: 2,
                    }}
                  />
                );
              })()}
          </Map>

          {/* Region label */}
          <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
            <p className="text-xs font-medium text-slate-500">
              Real-time disaster map
            </p>

            <p className="text-sm font-bold text-slate-900">
              Nepal · 27.7° N – 30.5° N, 80° E – 88.2° E
            </p>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button
              onClick={() =>
                setMapZoom((z) =>
                  Math.min(z + 1, 18)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              onClick={() =>
                setMapZoom((z) =>
                  Math.max(z - 1, 1)
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" />
            </button>

            <button
              onClick={() => {
                setMapCenter([
                  NEPAL_CENTER.lat,
                  NEPAL_CENTER.lng,
                ]);
                setMapZoom(7);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/95 px-5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-600" />
              Wildfire
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              Earthquake
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-700" />
              Flood
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-600" />
              Cyclone
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-orange-600" />
              Extreme Temp
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-red-800" />
              Volcano
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
              Investigating
            </span>

            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Investigated
            </span>
          </div>

          {/* Selected disaster detail panel */}
          {selectedDisaster && (
            <div className="absolute right-4 top-16 w-80 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Event Details
                </h3>

                <button
                  onClick={() => {
                    setSelectedDisaster(null);
                    setPolygon(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Event Name
                  </p>

                  <p className="text-sm font-bold text-slate-900">
                    {selectedDisaster.event_name ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Location
                  </p>

                  <p className="text-sm text-slate-900">
                    {[
                      selectedDisaster.city,
                      selectedDisaster.state,
                    ].filter(Boolean).join(", ") ||
                      `${selectedDisaster.lat.toFixed(
                        4
                      )}°N, ${selectedDisaster.lng.toFixed(
                        4
                      )}°E`}
                  </p>
                </div>

                <div className="flex gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Event Type
                    </p>

                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                        EVENT_TYPE_COLORS[
                          selectedDisaster
                            .event_type
                        ] ||
                        EVENT_TYPE_COLORS["Misc"]
                      }`}
                    >
                      {selectedDisaster.event_type}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500">
                      Alert Level
                    </p>

                    <p
                      className={`text-sm font-semibold capitalize ${
                        selectedDisaster.alert_level ===
                          "Red" ||
                        selectedDisaster.alert_level ===
                          "Orange"
                          ? "text-red-600"
                          : selectedDisaster.alert_level ===
                            "Yellow"
                          ? "text-amber-600"
                          : "text-slate-600"
                      }`}
                    >
                      {selectedDisaster.alert_level ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Risk Level
                  </p>

                  <p className="text-sm text-slate-900">
                    {selectedDisaster.proximity_severity_level ||
                      "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Event Period
                  </p>

                  <p className="text-sm text-slate-900">
                    {selectedDisaster.date
                      ? `${new Date(
                          selectedDisaster.date
                        ).toLocaleDateString()} – ${new Date(
                          selectedDisaster.end_date
                        ).toLocaleDateString()}`
                      : new Date(
                          selectedDisaster.created_time
                        ).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500">
                    Affected Area
                  </p>

                  {loadingPolygon ? (
                    <p className="text-xs text-slate-500">
                      Loading polygon…
                    </p>
                  ) : polygon ? (
                    <p className="font-semibold text-xs text-emerald-600">
                      Polygon loaded ({polygon.length}{" "}
                      points)
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      Point event — no polygon boundary
                      available from NASA EONET/GDACS
                    </p>
                  )}
                </div>

                {selectedDisaster.details &&
                  Object.keys(
                    selectedDisaster.details
                  ).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Impact Details
                      </p>

                      <div className="mt-1 space-y-1">
                        {Object.entries(
                          selectedDisaster.details
                        ).map(([key, value]) =>
                          value != null ? (
                            <div
                              key={key}
                              className="flex justify-between text-[11px]"
                            >
                              <span className="capitalize text-slate-500">
                                {key.replace(
                                  /_/g,
                                  " "
                                )}
                              </span>

                              <span className="font-semibold text-slate-900">
                                {String(value)}
                              </span>
                            </div>
                          ) : null
                        )}
                      </div>
                    </div>
                  )}

                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-slate-500">
                    Investigation
                  </p>

                  {!investigationId ? (
                    <>
                      {!nearestTeam &&
                        !investigating && (
                          <Button
                            size="sm"
                            onClick={
                              handleInvestigate
                            }
                            className="w-full gap-2 bg-amber-600 font-semibold text-white hover:bg-amber-700"
                          >
                            <Search className="h-4 w-4" />
                            Investigate
                          </Button>
                        )}

                      {investigating && (
                        <div className="flex items-center justify-center gap-2 py-2">
                          <Loader2 className="h-4 w-4 animate-spin text-amber-600" />

                          <span className="text-xs font-semibold text-slate-600">
                            Finding nearest team...
                          </span>
                        </div>
                      )}

                      {nearestTeam && (
                        <div className="space-y-2">
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                            <p className="text-xs font-bold text-amber-900">
                              Nearest Team
                            </p>

                            <p className="text-sm font-semibold text-amber-800">
                              {nearestTeam.teamName}
                            </p>

                            <p className="text-[11px] text-amber-700">
                              {nearestTeam.district},{" "}
                              {nearestTeam.province}
                            </p>

                            <p className="text-[11px] text-amber-700">
                              {nearestTeam.distanceKm}{" "}
                              km · ~
                              {
                                nearestTeam.etaMinutes
                              }{" "}
                              min ETA
                            </p>

                            <p className="text-[11px] text-amber-700">
                              Leader:{" "}
                              {
                                nearestTeam.leadName
                              }{" "}
                              (
                              {
                                nearestTeam.leadPhone
                              }
                              )
                            </p>
                          </div>

                          <Button
                            size="sm"
                            onClick={
                              handleAssignInvestigation
                            }
                            className="w-full gap-2 bg-red-600 font-semibold text-white hover:bg-red-700"
                          >
                            <UserPlus className="h-4 w-4" />
                            Assign Team
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div
                      className={`rounded-lg border p-2 ${
                        isInvestigationComplete
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <p
                        className={`text-xs font-bold ${
                          isInvestigationComplete
                            ? "text-emerald-900"
                            : "text-amber-900"
                        }`}
                      >
                        {isInvestigationComplete
                          ? "Investigation Investigated"
                          : "Investigation Active"}
                      </p>

                      <p className="text-[11px] text-emerald-700">
                        ID: {investigationId}
                      </p>

                      <p className="text-[11px] text-emerald-700">
                        Status:{" "}
                        {getInvestigationDisplayStatus(
                          currentInvestigationStatus,
                          currentAssessment
                        )}
                      </p>

                      {currentAssessment && (
                        <p className="text-[11px] text-emerald-700">
                          Assessment:{" "}
                          {currentAssessment.replace(
                            "_",
                            " "
                          )}
                        </p>
                      )}

                      <p className="text-[11px] text-emerald-700">
                        Assigned: Team assigned
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

