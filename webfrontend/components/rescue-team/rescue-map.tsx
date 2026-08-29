"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Map, Overlay } from "pigeon-maps";
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

export interface RescueMember {
  name: string;
  email: string;
  phone: string;
  role: string;
  citizenshipNumber?: string;
  citizenshipDocUrl?: string;
}

export interface RescueTeam {
  id: string;
  name: string;
  initial: string;
  capability: string;
  station: string;
  district: string;
  province?: string;
  lead: string;
  phone: string;
  leadEmail?: string;
  leadCitizenshipNumber?: string;
  leadCitizenshipDocUrl?: string;
  teamLetterDocUrl?: string;
  membersCount: number;
  members?: RescueMember[];
  capabilities?: string[];
  availability: Availability;
  assignment: string | null;
  readiness: number | null;
  lat: number;
  lng: number;
  registrationId?: string;
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

const DEFAULT_CENTER: [number, number] = [27.75, 86.65]; // Solukhumbu / Khumbu region
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

  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(isExpanded ? 11 : 10);

  React.useEffect(() => {
    if (activeSelected) {
      setMapCenter([activeSelected.lat, activeSelected.lng]);
      setMapZoom(12);
    } else {
      setMapCenter(DEFAULT_CENTER);
    }
  }, [activeSelected]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xs ${className}`}>
      <Map
        center={mapCenter}
        zoom={mapZoom}
        onBoundsChanged={({ center, zoom }) => {
          setMapCenter(center);
          setMapZoom(zoom);
        }}
        boxClassname="h-full w-full"
      >
        {filteredTeams.map((team) => {
          const isSelected = activeSelected?.id === team.id;
          return (
            <Overlay
              key={team.id}
              anchor={[team.lat, team.lng]}
              offset={[16, 16]}
            >
              <div 
                className="group relative cursor-pointer transition-transform duration-200 hover:scale-110"
                onClick={() => handleSelectTeam(team)}
                title={`${team.name} (${team.station})`}
              >
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
            </Overlay>
          );
        })}


            {activeSelected && (
              <Overlay
                anchor={[activeSelected.lat, activeSelected.lng]}
                offset={[140, 200]}
              >
                <div className="relative w-64 rounded-xl border border-slate-200 bg-white shadow-xl">
                  {/* Close button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectTeam(null);
                    }}
                    className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                  >
                    ×
                  </button>
                  
                  {/* Header */}
                  <div className="flex items-center gap-2 border-b border-slate-100 p-3 pr-8">
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
                  
                  {/* Body */}
                  <div className="p-3 font-sans text-xs text-slate-700">
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
                </div>
              </Overlay>
            )}
          </Map>

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

      {/* Floating Controls: Zoom & Expand */}
      {showControls && (
        <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
          {onToggleExpand && (
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
          )}
          <button 
            onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setMapZoom((z) => Math.max(z - 1, 1))}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:bg-slate-50"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button 
            onClick={() => {
              setMapCenter(DEFAULT_CENTER);
              setMapZoom(isExpanded ? 11 : 10);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white/95 text-slate-700 shadow-md backdrop-blur hover:bg-slate-50"
          >
            <LocateFixed className="h-4 w-4" />
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

