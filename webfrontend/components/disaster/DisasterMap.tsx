"use client";

import { Map, Overlay, GeoJson } from "pigeon-maps";
import { Plus, Minus, LocateFixed } from "lucide-react";

import { DisasterMarker } from "@/components/disaster/DisasterMarker";
import { NEPAL_CENTER } from "@/lib/disaster-config";
import { DisasterEvent, Investigation } from "@/lib/disaster-config";
import { getInvestigationStatusStyle } from "@/lib/disaster-utils";

interface DisasterMapProps {
  mapCenter: [number, number];
  mapZoom: number;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number | ((prev: number) => number)) => void;
  filteredDisasters: DisasterEvent[];
  investigations: Investigation[];
  polygon: [number, number][] | null;
  selectedDisaster: DisasterEvent | null;
  onSelectDisaster: (disaster: DisasterEvent) => void;
}

export function DisasterMap({
  mapCenter,
  mapZoom,
  setMapCenter,
  setMapZoom,
  filteredDisasters,
  investigations,
  polygon,
  selectedDisaster,
  onSelectDisaster,
}: DisasterMapProps) {
  return (
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
          const activeInv = investigations.find(
            (inv) =>
              inv.disasterEventId === disaster.event_id &&
              (inv.status === "investigating" || inv.status === "pending")
          );

          if (activeInv) {
            const invStyle = getInvestigationStatusStyle(activeInv);
            return (
              <Overlay
                key={disaster.event_id}
                anchor={[disaster.lat, disaster.lng]}
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
                  <div
                    className={`relative h-10 w-10 overflow-hidden rounded-full border-[3px] ${invStyle.border} shadow-lg backdrop-blur-sm`}
                  >
                    <div className="flex h-full w-full items-center justify-center bg-slate-900/80">
                      <DisasterMarker
                        eventType={disaster.event_type}
                        severity={disaster.proximity_severity_level}
                      />
                    </div>
                  </div>
                  <div
                    className={`absolute -bottom-5 whitespace-nowrap rounded-full ${invStyle.badge} px-2 py-0.5 text-[9px] font-bold text-white shadow-md`}
                  >
                    {invStyle.label}
                  </div>
                </div>
              </Overlay>
            );
          }

          return (
            <Overlay
              key={disaster.event_id}
              anchor={[disaster.lat, disaster.lng]}
              offset={[16, 32]}
            >
              <div
                onClick={() => onSelectDisaster(disaster)}
                className="cursor-pointer"
              >
                <DisasterMarker
                  eventType={disaster.event_type}
                  severity={disaster.proximity_severity_level}
                  onClick={() => onSelectDisaster(disaster)}
                />
              </div>
            </Overlay>
          );
        })}

        {polygon &&
          polygon.length > 1 &&
          (() => {
            const coords = polygon.map(
              ([lat, lng]) => [lng, lat] as [number, number]
            );

            if (
              coords[0] &&
              (coords[0][0] !== coords[coords.length - 1]?.[0] ||
                coords[0][1] !== coords[coords.length - 1]?.[1])
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
              selectedDisaster?.alert_level === "Red" ||
              selectedDisaster?.alert_level === "Orange";

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

      <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
        <p className="text-xs font-medium text-slate-500">
          Real-time disaster map
        </p>
        <p className="text-sm font-bold text-slate-900">
          Nepal · 27.7° N – 30.5° N, 80° E – 88.2° E
        </p>
      </div>

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
          onClick={() => {
            setMapCenter([NEPAL_CENTER.lat, NEPAL_CENTER.lng]);
            setMapZoom(7);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

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
    </div>
  );
}
