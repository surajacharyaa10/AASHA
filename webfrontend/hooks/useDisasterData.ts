"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DisasterEvent,
  Investigation,
  DISASTER_API,
  GeometryResponse,
  TimeRange,
  LIVE_HAZARDS_API,
} from "@/lib/disaster-config";

export function useDisasters(timeRange: TimeRange, eventTypeFilter: string | null) {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisasters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const days = timeRange === 0 ? 1 : timeRange ?? undefined;
      const url = DISASTER_API.latestByCountry(
        "NPL",
        200,
        1,
        days,
        eventTypeFilter ?? undefined
      );
      const res = await fetch(url);

      if (!res.ok) {
        setError(
          `Unable to load disasters (HTTP ${res.status}). The disaster data provider may be rate-limiting requests.`
        );
        setDisasters([]);
        return;
      }

      const data = await res.json();
      let events = Array.isArray(data?.result) ? data.result : [];

      if (timeRange === 0) {
        const now = new Date();
        events = events.filter((event: DisasterEvent) => {
          if (!event.end_date) return true;
          const endDate = new Date(event.end_date);
          return endDate > now;
        });
      }

      setDisasters(events as DisasterEvent[]);
    } catch (err) {
      console.error("Failed to fetch disasters:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch disaster data"
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

  return { disasters, loading, error, refresh: fetchDisasters };
}

// Normalize a USGS earthquake feed hazard into the shared DisasterEvent shape.
// The feed is proxied through our backend (/api/disasters/live-hazards) so the
// browser never calls a third-party URL directly — avoids CORS and rate-limit
// failures that broke the old DynamicFeed call.
function usgsHazardToDisasterEvent(hazard: any, index: number): DisasterEvent {
  const eventTypeMap: Record<string, string> = {
    earthquake: "EQ",
    landslide: "LS",
    explosion: "EX",
    icequake: "EQ",
    volcanic: "VO",
  };
  const eventType =
    eventTypeMap[(hazard?.type || "").toLowerCase()] || "EQ";

  const severityMap: Record<string, string> = {
    Red: "Red",
    Orange: "Orange",
    Yellow: "Yellow",
    Green: "Green",
  };

  return {
    event_id: hazard?.id || `usgs-${index}`,
    event_type: eventType,
    event_name:
      hazard?.headline ||
      `M${hazard?.magnitude ?? "?"} ${hazard?.type || "event"}`,
    city: "",
    state: "",
    country_code: "NPL",
    lat: hazard?.latitude,
    lng: hazard?.longitude,
    date: hazard?.time,
    alert_level: severityMap[hazard?.severity] || hazard?.severity,
    proximity_severity_level:
      hazard?.severity === "Red"
        ? "High Risk"
        : hazard?.severity === "Orange"
        ? "Moderate Risk"
        : "Low Risk",
    details: {
      distance_km: hazard?.distance_km,
      source: hazard?.source,
      type: hazard?.type,
      magnitude: hazard?.magnitude,
    },
    end_date: hazard?.time,
    created_time: hazard?.time,
    source_event_id: hazard?.id || `usgs-${index}`,
    isDynamicFeed: true,
  };
}

export function useDynamicFeedHazards() {
  const [hazards, setHazards] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHazards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(LIVE_HAZARDS_API);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      const raw: any[] = Array.isArray(data?.hazards) ? data.hazards : [];

      const normalized: DisasterEvent[] = raw.map((hazard, index) =>
        usgsHazardToDisasterEvent(hazard, index)
      );
      setHazards(normalized);
    } catch (err) {
      console.error("Failed to fetch live hazards:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch live hazards"
      );
      setHazards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHazards();
    const interval = setInterval(fetchHazards, 300000);
    return () => clearInterval(interval);
  }, [fetchHazards]);

  return { hazards, loading, error, refresh: fetchHazards };
}

export function useInvestigations() {
  const [investigations, setInvestigations] = useState<Investigation[]>([]);

  const fetchInvestigations = useCallback(async () => {
    try {
      const res = await fetch(DISASTER_API.investigations);
      if (!res.ok) return;
      const data = await res.json();
      setInvestigations(data.investigations || []);
    } catch (err) {
      console.error("Failed to fetch investigations:", err);
    }
  }, []);

  useEffect(() => {
    fetchInvestigations();
    const interval = setInterval(fetchInvestigations, 15000);
    return () => clearInterval(interval);
  }, [fetchInvestigations]);

  return { investigations, refresh: fetchInvestigations };
}

export function useDisasterGeometry() {
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);
  const [loadingPolygon, setLoadingPolygon] = useState(false);

  const fetchPolygon = useCallback(async (sourceEventId: string) => {
    setLoadingPolygon(true);
    setPolygon(null);

    try {
      const res = await fetch(DISASTER_API.geometry(sourceEventId));
      if (!res.ok) {
        console.error("Failed to fetch disaster polygon:", res.status);
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
      console.error("Failed to fetch polygon:", err);
      setPolygon(null);
    } finally {
      setLoadingPolygon(false);
    }
  }, []);

  const clearPolygon = useCallback(() => {
    setPolygon(null);
  }, []);

  return { polygon, loadingPolygon, fetchPolygon, clearPolygon };
}
