"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  CheckCircle2,
  Users,
  Clock,
  Radio,
  Plus,
  Minus,
  LocateFixed,
  Maximize2,
  Minimize2,
  Phone,
  Shield,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type Availability = "available" | "deployed" | "off-duty";

export interface RescueTeam {
  id: string;
  name: string;
  initial: string;
  capability: string;
  station: string;
  district: string;
  lead: string;
  phone: string;
  membersCount: number;
  availability: Availability;
  assignment: string | null;
  readiness: number | null;
  lat: number;
  lng: number;
}

interface RescueMapProps {
  teams: RescueTeam[];
  selectedTeam?: RescueTeam | null;
  onSelectTeam?: (team: RescueTeam | null) => void;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  showControls?: boolean;
}

const DEFAULT_CENTER = { lat: 27.75, lng: 86.65 }; // Solukhumbu / Khumbu region

function MapController({
  target,
  zoom,
}: {
  target: { lat: number; lng: number } | null;
  zoom?: number;
}) {
  const map = useMap();
  React.useEffect(() => {
    if (map && target) {
      map.panTo(target);
      if (zoom) map.setZoom(zoom);
    }
  }, [map, target, zoom]);

  return null;
}

export function RescueMap({
  teams,
  selectedTeam: controlledSelectedTeam,
  onSelectTeam,
  className = "h-full w-full",
  isExpanded = false,
  onToggleExpand,
  showControls = true,
}: RescueMapProps) {
  const [internalSelectedTeam, setInternalSelectedTeam] =
    useState<RescueTeam | null>(null);
  const [filter, setFilter] = useState<"all" | Availability>("all");

  const activeSelected =
    controlledSelectedTeam !== undefined
      ? controlledSelectedTeam
      : internalSelectedTeam;

  const handleSelectTeam = useCallback(
    (team: RescueTeam | null) => {
      if (onSelectTeam) {
        onSelectTeam(team);
      } else {
        setInternalSelectedTeam(team);
      }
    },
    [onSelectTeam]
  );

  const filteredTeams = useMemo(() => {
    if (filter === "all") return teams;
    return teams.filter((t) => t.availability === filter);
  }, [teams, filter]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs ${className}`}>
      {apiKey ? (
        <APIProvider apiKey={apiKey}>
          <Map
            defaultCenter={DEFAULT_CENTER}
            defaultZoom={isExpanded ? 11 : 10}
            mapId="aasha-rescue-map"
            disableDefaultUI={true}
            gestureHandling="greedy"
            className="h-full w-full"
          >
            {activeSelected && (
              <MapController
                target={{ lat: activeSelected.lat, lng: activeSelected.lng }}
                zoom={12}
              />
            )}

            {filteredTeams.map((team) => {
              const isSelected = activeSelected?.id === team.id;
              return (
                <AdvancedMarker
                  key={team.id}
                  position={{ lat: team.lat, lng: team.lng }}
                  onClick={() => handleSelectTeam(team)}
                  title={`${team.name} (${team.station})`}
                >
                  <div className="group relative cursor-pointer transition-transform duration-200 hover:scale-110">
                    {team.availability === "deployed" && (
                      <>
                        <span className="absolute -inset-2 animate-ping rounded-full bg-blue-500/30" />
                        <span className="absolute -inset-1 rounded-full bg-blue-500/20" />
                      </>
                    )}
                    {team.availability === "available" && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-500/20" />
                    )}

                    <div
                      className={`relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-md transition-all ${
                        isSelected
                          ? "ring-3 ring-slate-900 ring-offset-2"
                          : ""
                      } ${
                        team.availability === "available"
                          ? "bg-emerald-600 text-white"
                          : team.availability === "deployed"
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      <div className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                        {team.initial}
                      </div>
                      <span className="text-xs font-semibold whitespace-nowrap">
                        {team.name}
                      </span>
                    </div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {activeSelected && (
              <InfoWindow
                position={{ lat: activeSelected.lat, lng: activeSelected.lng }}
                onCloseClick={() => handleSelectTeam(null)}
                pixelOffset={[0, -25]}
                headerContent={
                  <div className="flex items-center gap-2 pr-2 font-sans">
                    <span className="font-bold text-slate-900">
                      {activeSelected.name}
                    </span>
                    <Badge
                      variant={
                        activeSelected.availability === "available"
                          ? "success"
                          : activeSelected.availability === "deployed"
                          ? "info"
                          : "secondary"
                      }
                      className="text-[10px] uppercase font-bold"
                    >
                      {activeSelected.availability}
                    </Badge>
                  </div>
                }
              >
                <div className="w-64 p-1 font-sans text-xs text-slate-700">
                  <div className="mb-2 flex items-center gap-1 text-slate-500">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{activeSelected.station}, {activeSelected.district}</span>
                  </div>

                  <p className="mb-2 rounded bg-slate-100 p-1.5 text-slate-600 font-medium">
                    {activeSelected.capability}
                  </p>

                  <div className="mb-2.5 space-y-1 border-t border-slate-100 pt-2 text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Team Lead:</span>
                      <span className="font-semibold text-slate-800">
                        {activeSelected.lead}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Readiness:</span>
                      <span className="font-semibold text-slate-800">
                        {activeSelected.readiness !== null ? `${activeSelected.readiness}%` : "--"}
                      </span>
                    </div>
                    {activeSelected.assignment && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mission:</span>
                        <span className="font-bold text-blue-600">
                          {activeSelected.assignment}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <a
                      href={`tel:${activeSelected.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                    >
                      <Phone className="h-3 w-3" />
                      Call Lead
                    </a>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      ) : (
        /* Fallback Interactive Radar / Map Visualization when API key is not yet set */
        <div className="relative flex h-full w-full flex-col items-center justify-center bg-radial from-slate-100 to-slate-200 p-6 text-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          
          <div className="relative z-10 max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-lg backdrop-blur">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Live Coverage Radar</h4>
            <p className="mt-1 text-xs text-slate-500">
              {teams.length} rescue teams stationed across Solukhumbu and Everest region.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2 text-left text-xs">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleSelectTeam(t)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                    activeSelected?.id === t.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      t.availability === "available"
                        ? "bg-emerald-500"
                        : t.availability === "deployed"
                        ? "bg-blue-500"
                        : "bg-slate-400"
                    }`}
                  />
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">{t.name}</p>
                    <p className="text-[10px] text-slate-400">{t.station}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Top Header: Region + Filter Chips */}
      {showControls && (
        <div className="absolute left-4 top-4 z-10 flex flex-wrap items-center gap-2">
          <div className="rounded-xl border border-slate-200 bg-white/95 px-3.5 py-2 shadow-md backdrop-blur">
            <p className="text-[10px] font-medium text-slate-500">Coverage Sector</p>
            <p className="text-xs font-bold text-slate-900">Solukhumbu & Everest</p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white/95 p-1 shadow-md backdrop-blur">
            {(["all", "available", "deployed", "off-duty"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFilter(mode)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold capitalize transition-all ${
                  filter === mode
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {mode === "all" ? `All (${teams.length})` : mode}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Floating Controls: Expand / Reset */}
      {showControls && onToggleExpand && (
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          <button
            onClick={onToggleExpand}
            title={isExpanded ? "Collapse map" : "Expand map"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:bg-slate-50"
          >
            {isExpanded ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Bottom Floating Legend */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-4 rounded-full border border-slate-200 bg-white/95 px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Available ({teams.filter((t) => t.availability === "available").length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Deployed ({teams.filter((t) => t.availability === "deployed").length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />
          Off Duty ({teams.filter((t) => t.availability === "off-duty").length})
        </span>
      </div>
    </div>
  );
}

