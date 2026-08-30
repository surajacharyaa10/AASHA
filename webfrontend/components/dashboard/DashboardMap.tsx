"use client";

import { useState } from "react";
import { Map, Overlay } from "pigeon-maps";
import { Plus, Minus, LocateFixed } from "lucide-react";
import type { SosEvent } from "@/app/components/SOSDetails";
import { SosMarker } from "./SosMarker";

interface DashboardMapProps {
  events: SosEvent[];
  onSelectEvent: (event: SosEvent) => void;
}

export function DashboardMap({ events, onSelectEvent }: DashboardMapProps) {
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.3949, 84.1240]);
  const [mapZoom, setMapZoom] = useState(7);

  return (
    <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs">
      <Map
        center={mapCenter}
        zoom={mapZoom}
        onBoundsChanged={({ center, zoom }) => {
          setMapCenter(center);
          setMapZoom(zoom);
        }}
      >
        {events
          .filter((e) => typeof e.lat === "number" && typeof e.lng === "number")
          .map((event) => (
            <Overlay
              key={event.id}
              anchor={[event.lat as number, event.lng as number]}
              offset={[16, 32]}
            >
              <div onClick={() => onSelectEvent(event)} className="cursor-pointer">
                <SosMarker status={event.status} onClick={() => onSelectEvent(event)} />
              </div>
            </Overlay>
          ))}
      </Map>

      {/* Region label */}
      <div className="absolute left-4 top-4 rounded-xl border border-slate-200 bg-white/95 px-4 py-2.5 shadow-md backdrop-blur">
        <p className="text-xs font-medium text-slate-500">Live operational map</p>
        <p className="text-sm font-bold text-slate-900">Nepal · Nationwide Operations</p>
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
          onClick={() => { setMapCenter([28.3949, 84.1240]); setMapZoom(7); }}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white/95 px-5 py-2 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> Pending</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Assigned</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Resolved</span>
      </div>
    </div>
  );
}
