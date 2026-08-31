"use client";

import { useCallback, useEffect, useState } from "react";
import {
  DisasterEvent,
  Investigation,
  DynamicFeedHazard,
  DISASTER_API,
  GeometryResponse,
  TimeRange,
  dynamicFeedHazardToDisasterEvent,
  DYNAMICFEED_API_URL,
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

export function useDynamicFeedHazards() {
  const [hazards, setHazards] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHazards = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = `${DYNAMICFEED_API_URL}?lat=${28.3949}&lon=${84.1240}&radius_km=500`;
      const res = await fetch(url, { next: { revalidate: 60 } });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();

      if (data.hazards && Array.isArray(data.hazards)) {
        const normalized: DisasterEvent[] = data.hazards.map((hazard: DynamicFeedHazard, index: number) =>
          dynamicFeedHazardToDisasterEvent(hazard, index)
        );
        setHazards(normalized);
      } else {
        setHazards([]);
      }
    } catch (err) {
      console.error("Failed to fetch DynamicFeed hazards:", err);
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
