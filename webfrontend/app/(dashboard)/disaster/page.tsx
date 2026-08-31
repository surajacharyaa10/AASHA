"use client";

import { useState, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

import { DisasterFilters } from "@/components/disaster/DisasterFilters";
import { DisasterStats } from "@/components/disaster/DisasterStats";
import { DisasterList } from "@/components/disaster/DisasterList";
import { DisasterMap } from "@/components/disaster/DisasterMap";
import { DisasterDetailPanel } from "@/components/disaster/DisasterDetailPanel";

import {
  TimeRange,
  DisasterEvent,
  NearestTeam,
  DISASTER_API,
} from "@/lib/disaster-config";
import {
  useDisasters,
  useInvestigations,
  useDisasterGeometry,
  useDynamicFeedHazards,
} from "@/hooks/useDisasterData";

export default function DisasterPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>(0);
  const [eventTypeFilter, setEventTypeFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const { disasters, loading: disastersLoading, error, refresh } = useDisasters(
    timeRange,
    eventTypeFilter
  );
  const { hazards, loading: hazardsLoading } = useDynamicFeedHazards();
  const { investigations } = useInvestigations();
  const { polygon, loadingPolygon, fetchPolygon, clearPolygon } = useDisasterGeometry();

  const [selectedDisaster, setSelectedDisaster] =
    useState<DisasterEvent | null>(null);

  const [mapCenter, setMapCenter] = useState<[number, number]>([28.3949, 84.124]);
  const [mapZoom, setMapZoom] = useState<number>(7);

  const [investigating, setInvestigating] = useState(false);
  const [nearestTeam, setNearestTeam] = useState<NearestTeam | null>(null);
  const [investigationId, setInvestigationId] = useState<string | null>(null);
  const [investigationStatus, setInvestigationStatus] =
    useState<string | null>(null);

  const loading = disastersLoading || hazardsLoading;

  const allEvents = useMemo(() => {
    const backendEvents = disasters.map((d) => ({
      ...d,
      isDynamicFeed: false as const,
    }));
    const liveHazards = hazards.map((h) => ({
      ...h,
      isDynamicFeed: true as const,
    }));

    const combined = [...backendEvents, ...liveHazards];
    const seen = new Map<string, DisasterEvent>();

    for (const event of combined) {
      const key = `${event.lat.toFixed(2)}-${event.lng.toFixed(2)}`;
      if (!seen.has(key)) {
        seen.set(key, event);
      }
    }

    return Array.from(seen.values());
  }, [disasters, hazards]);

  const filteredDisasters = useMemo(() => {
    if (!eventTypeFilter) return allEvents;
    return allEvents.filter((d) => d.event_type === eventTypeFilter);
  }, [allEvents, eventTypeFilter]);

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    filteredDisasters.forEach((d) => {
      byType[d.event_type] = (byType[d.event_type] || 0) + 1;
    });
    return {
      total: filteredDisasters.length,
      byType,
    };
  }, [filteredDisasters]);

  const activeFilterCount =
    (timeRange !== 7 ? 1 : 0) + (eventTypeFilter ? 1 : 0);

  const detailInvestigation = investigationId
    ? investigations.find((inv) => inv.id === investigationId)
    : null;
  const currentInvestigationStatus =
    detailInvestigation?.status || investigationStatus || "investigating";
  const currentAssessment = detailInvestigation?.assessment;
  const isInvestigationComplete =
    currentInvestigationStatus === "resolved" ||
    currentInvestigationStatus === "false_alarm";

  const handleSelectDisaster = (disaster: DisasterEvent) => {
    setSelectedDisaster(disaster);

    if (
      disaster.source_event_id &&
      !disaster.source_event_id.startsWith("EONET-") &&
      !disaster.source_event_id.startsWith("GDACS-")
    ) {
      fetchPolygon(disaster.source_event_id);
    } else {
      clearPolygon();
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
        DISASTER_API.nearestTeam(selectedDisaster.lat, selectedDisaster.lng)
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
      console.error("Failed to find nearest team:", err);
      setNearestTeam(null);
    } finally {
      setInvestigating(false);
    }
  };

  const handleAssignInvestigation = async () => {
    if (!selectedDisaster || !nearestTeam) return;

    try {
      const createRes = await fetch(DISASTER_API.createInvestigation, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          disasterEventId: selectedDisaster.event_id,
          disasterName: selectedDisaster.event_name,
          lat: selectedDisaster.lat,
          lng: selectedDisaster.lng,
          location: [selectedDisaster.city, selectedDisaster.state, selectedDisaster.country_code]
            .filter(Boolean)
            .join(", "),
        }),
      });

      if (!createRes.ok) {
        throw new Error(`HTTP ${createRes.status}`);
      }

      const created = await createRes.json();
      setInvestigationId(created.id);

      const assignRes = await fetch(
        DISASTER_API.assignInvestigation(created.id),
        {
          method: "POST",
        }
      );

      if (!assignRes.ok) {
        throw new Error(`HTTP ${assignRes.status}`);
      }

      const assigned = await assignRes.json();
      setInvestigationStatus(
        assigned.investigation?.status || "investigating"
      );
      setNearestTeam(null);
    } catch (err) {
      console.error("Failed to assign investigation:", err);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
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
                    eventTypeFilter ? `· ${eventTypeFilter}` : ""
                  } ${
                    timeRange === null
                      ? "(all time)"
                      : `(last ${timeRange} days)`
                  }`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DisasterFilters
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            eventTypeFilter={eventTypeFilter}
            setEventTypeFilter={setEventTypeFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            activeFilterCount={activeFilterCount}
            loading={loading}
            onRefresh={refresh}
          />
        </div>
      </header>

      <DisasterStats
        stats={stats}
        filteredDisasters={filteredDisasters}
        liveCount={hazards.length}
      />

      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        <DisasterList
          filteredDisasters={filteredDisasters}
          loading={loading}
          error={error}
          selectedDisaster={selectedDisaster}
          investigations={investigations}
          onSelectDisaster={handleSelectDisaster}
        />

        <DisasterMap
          mapCenter={mapCenter}
          mapZoom={mapZoom}
          setMapCenter={setMapCenter}
          setMapZoom={setMapZoom}
          filteredDisasters={filteredDisasters}
          investigations={investigations}
          polygon={polygon}
          selectedDisaster={selectedDisaster}
          onSelectDisaster={handleSelectDisaster}
        />

        {selectedDisaster && (
          <DisasterDetailPanel
            selectedDisaster={selectedDisaster}
            polygon={polygon}
            loadingPolygon={loadingPolygon}
            investigationId={investigationId}
            currentInvestigationStatus={currentInvestigationStatus}
            currentAssessment={currentAssessment}
            isInvestigationComplete={isInvestigationComplete}
            nearestTeam={nearestTeam}
            investigating={investigating}
            onClose={() => {
              setSelectedDisaster(null);
              clearPolygon();
            }}
            onInvestigate={handleInvestigate}
            onAssignInvestigation={handleAssignInvestigation}
          />
        )}
      </div>
    </div>
  );
}
