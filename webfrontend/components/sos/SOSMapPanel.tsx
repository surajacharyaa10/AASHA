"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, Mountain } from "lucide-react";
import { Map, Overlay } from "pigeon-maps";
import { Button } from "@/components/ui/button";
import type { SosEvent, SosStatus } from "@/app/components/SOSDetails";
import { SosMarker } from "@/components/dashboard/SosMarker";

interface SOSMapPanelProps {
  event: SosEvent;
  currentStatus: SosStatus;
}

export function SOSMapPanel({ event, currentStatus }: SOSMapPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${event.lat}, ${event.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Location &amp; Terrain</h3>
          <p className="text-xs text-slate-500">
            {event.lat}° N, {event.lng}° E · {event.elevation ? `${event.elevation.toLocaleString()}m elevation` : "Khumbu sector"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyCoords}
          className="gap-1.5 border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy Coordinates"}
        </Button>
      </div>

      <div className="relative mt-3 h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
        {event.lat && event.lng ? (
          <Map
            defaultCenter={[event.lat, event.lng]}
            defaultZoom={13}
          >
            <Overlay anchor={[event.lat, event.lng]} offset={[16, 32]}>
              <SosMarker status={currentStatus} />
            </Overlay>
          </Map>
        ) : (
          <div className="relative flex h-full w-full items-center justify-center bg-radial from-slate-100 to-slate-200 p-6 text-center">
            <SosMarker status={currentStatus} />
          </div>
        )}

        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur">
          <Mountain className="h-4 w-4 text-slate-500" />
          {event.terrainLabel ?? "Khumbu valley · marked SOS beacon"}
        </div>
      </div>
    </div>
  );
}
