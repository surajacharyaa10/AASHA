"use client";

import { useState, useEffect, useMemo } from "react";
import { Map, Overlay, GeoJson } from "pigeon-maps";
import { Plus, Minus, LocateFixed, AlertTriangle, RefreshCw, Shield, Globe } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisasterMarker } from "@/components/disaster/DisasterMarker";

const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

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
    geometry?: { coordinates?: number[][][] };
  }>;
}

export default function DisasterPage() {
  const [disasters, setDisasters] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedDisaster, setSelectedDisaster] = useState<DisasterEvent | null>(null);
  const [polygon, setPolygon] = useState<[number, number][] | null>(null);
  const [loadingPolygon, setLoadingPolygon] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([NEPAL_CENTER.lat, NEPAL_CENTER.lng]);
  const [mapZoom, setMapZoom] = useState(7);

  const fetchDisasters = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND}/api/disasters/latest/by-country-code?countryCode=NPL&limit=50&page=1`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const events = Array.isArray(data?.result) ? data.result : [];
      setDisasters(events as DisasterEvent[]);
    } catch (err) {
      console.error("Failed to fetch disasters:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch disaster data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchDisasters, 0);
    return () => clearTimeout(timer);
  }, []);

  const fetchPolygon = async (sourceEventId: string) => {
    setLoadingPolygon(true);
    setPolygon(null);
    try {
      const res = await fetch(`${BACKEND}/api/disasters/geometry/by-source-eventId?sourceEventId=${sourceEventId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json() as GeometryResponse;
      const geometry = data?.result?.[0]?.geometry;
      const coordinates = geometry?.coordinates;
      if (coordinates && coordinates.length > 0) {
        const outerRing = coordinates[0];
        const converted: [number, number][] = outerRing
          .filter((pt): pt is [number, number] => Array.isArray(pt) && pt.length >= 2)
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
  };

  const handleSelectDisaster = (disaster: DisasterEvent) => {
    setSelectedDisaster(disaster);
    if (disaster.source_event_id) {
      fetchPolygon(disaster.source_event_id);
    }
  };

  const stats = useMemo(() => {
    const byType: Record<string, number> = {};
    disasters.forEach((d) => {
      byType[d.event_type] = (byType[d.event_type] || 0) + 1;
    });
    return { total: disasters.length, byType };
  }, [disasters]);

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

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="h-9 w-9 border-slate-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Real-Time Disaster Monitor — Nepal</h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-700 border border-red-200">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {loading ? "Fetching latest disaster data…" : `Updated ${new Date().toLocaleTimeString()} · ${stats.total} active events in Nepal`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDisasters}
            className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Active Disasters</p>
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <p className="text-xs text-slate-500">in Nepal</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <Globe className="h-5 w-5 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Nearby Events</p>
            <span className="text-2xl font-bold text-slate-900">{disasters.length}</span>
            <p className="text-xs text-slate-500">regional</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs md:col-span-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">Event Types Active</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {Object.entries(stats.byType).map(([type, count]) => (
                <span key={type} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold border ${EVENT_TYPE_COLORS[type] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                  {type}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        {/* Disaster list */}
        <div className="w-80 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Disaster Events</h2>
            <p className="text-xs text-slate-500">{disasters.length} events in Nepal</p>
          </div>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-4 text-xs text-red-600">{error.message}</div>
          ) : disasters.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              <Shield className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              No active disasters detected in Nepal
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {disasters.map((disaster) => {
                const eventDate = new Date(disaster.date || disaster.created_time);
                const timeStr = eventDate.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
                const isSelected = selectedDisaster?.event_id === disaster.event_id;
                const colorClass = EVENT_TYPE_COLORS[disaster.event_type] || EVENT_TYPE_COLORS["Misc"];
                return (
                  <button
                    key={disaster.event_id}
                    onClick={() => handleSelectDisaster(disaster)}
                    className={`w-full text-left p-4 transition-colors hover:bg-slate-50 ${
                      isSelected ? "bg-slate-50 ring-1 ring-inset ring-slate-300" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{disaster.event_name || disaster.event_type}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{disaster.city || disaster.state || "Unknown location"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${colorClass}`}>
                        {disaster.event_type}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="font-medium">{timeStr}</span>
                      {disaster.alert_level && (
                        <span className={`font-semibold capitalize ${
                          disaster.alert_level === "Red" || disaster.alert_level === "Orange" ? "text-red-600" :
                          disaster.alert_level === "Yellow" ? "text-amber-600" :
                          "text-slate-500"
                        }`}>
                          {disaster.alert_level} alert
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Map */}
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
          <Map
            center={mapCenter}
            zoom={mapZoom}
            onBoundsChanged={({ center, zoom }) => {
              setMapCenter(center);
              setMapZoom(zoom);
            }}
          >
            {disasters.map((disaster) => (
              <Overlay
                key={disaster.event_id}
                anchor={[disaster.lat, disaster.lng]}
                offset={[16, 32]}
              >
                <div onClick={() => handleSelectDisaster(disaster)} className="cursor-pointer">
                  <DisasterMarker
                    eventType={disaster.event_type}
                    severity={disaster.proximity_severity_level}
                    onClick={() => handleSelectDisaster(disaster)}
                  />
                </div>
              </Overlay>
            ))}

            {polygon && polygon.length > 1 && (() => {
              const coords = polygon.map(([lat, lng]) => [lng, lat] as [number, number]);
              if (coords[0] && (coords[0][0] !== coords[coords.length - 1]?.[0] || coords[0][1] !== coords[coords.length - 1]?.[1])) {
                coords.push(coords[0]);
              }
              const geoJsonData = {
                type: "Feature",
                geometry: {
                  type: "Polygon",
                  coordinates: [coords],
                },
              };
              return (
                <GeoJson
                  data={geoJsonData}
                  style={{
                    fillColor: selectedDisaster?.alert_level === "Red" || selectedDisaster?.alert_level === "Orange" ? "rgba(220, 38, 38, 0.25)" : "rgba(245, 158, 11, 0.25)",
                    strokeColor: selectedDisaster?.alert_level === "Red" || selectedDisaster?.alert_level === "Orange" ? "rgba(220, 38, 38, 0.8)" : "rgba(245, 158, 11, 0.8)",
                    weight: 2,
                  }}
                />
              );
            })()}
          </Map>

          {/* Region label */}
          <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
            <p className="text-xs font-medium text-slate-500">Real-time disaster map</p>
            <p className="text-sm font-bold text-slate-900">Nepal · 27.7° N – 30.5° N, 80° E – 88.2° E</p>
          </div>

          {/* Zoom controls */}
          <div className="absolute right-4 top-4 flex flex-col gap-2">
            <button
              onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMapZoom((z) => Math.max(z - 1, 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => { setMapCenter([NEPAL_CENTER.lat, NEPAL_CENTER.lng]); setMapZoom(7); }}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <LocateFixed className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/95 px-5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-600" /> Wildfire</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-600" /> Earthquake</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-700" /> Flood</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-600" /> Cyclone</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-600" /> Extreme Temp</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-800" /> Volcano</span>
          </div>

          {/* Selected disaster detail panel */}
          {selectedDisaster && (
            <div className="absolute right-4 top-16 w-80 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-900">Event Details</h3>
                <button
                  onClick={() => { setSelectedDisaster(null); setPolygon(null); }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500">Event Name</p>
                  <p className="text-sm font-bold text-slate-900">{selectedDisaster.event_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Location</p>
                  <p className="text-sm text-slate-900">
                    {[selectedDisaster.city, selectedDisaster.state, selectedDisaster.country_code].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Event Type</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold border ${EVENT_TYPE_COLORS[selectedDisaster.event_type] || EVENT_TYPE_COLORS["Misc"]}`}>
                      {selectedDisaster.event_type}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Alert Level</p>
                    <p className={`text-sm font-semibold capitalize ${
                      selectedDisaster.alert_level === "Red" || selectedDisaster.alert_level === "Orange" ? "text-red-600" :
                      selectedDisaster.alert_level === "Yellow" ? "text-amber-600" :
                      "text-slate-600"
                    }`}>
                      {selectedDisaster.alert_level || "—"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Risk Level</p>
                  <p className="text-sm text-slate-900">{selectedDisaster.proximity_severity_level || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Event Period</p>
                  <p className="text-sm text-slate-900">
                    {selectedDisaster.date
                      ? `${new Date(selectedDisaster.date).toLocaleDateString()} – ${new Date(selectedDisaster.end_date).toLocaleDateString()}`
                      : new Date(selectedDisaster.created_time).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500">Affected Area</p>
                  {loadingPolygon ? (
                    <p className="text-xs text-slate-500">Loading polygon…</p>
                  ) : polygon ? (
                    <p className="text-xs text-emerald-600 font-semibold">Polygon loaded ({polygon.length} points)</p>
                  ) : (
                    <p className="text-xs text-slate-500">No polygon data available</p>
                  )}
                </div>
                {selectedDisaster.details && Object.keys(selectedDisaster.details).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500">Impact Details</p>
                    <div className="mt-1 space-y-1">
                      {Object.entries(selectedDisaster.details).map(([key, value]) => (
                        value != null && (
                          <div key={key} className="flex justify-between text-[11px]">
                            <span className="text-slate-500 capitalize">{key.replace(/_/g, " ")}</span>
                            <span className="font-semibold text-slate-900">{String(value)}</span>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
