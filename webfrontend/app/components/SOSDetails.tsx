"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  Phone,
  Share2,
  BatteryLow,
  Radio,
  Clock,
  Crosshair,
  Copy,
  Mountain,
  CheckCircle2,
  ArrowRight,
  Shield,
  MapPin,
  Check,
  UserCheck,
  Activity,
} from "lucide-react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
} from "@vis.gl/react-google-maps";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export type SosStatus = "pending" | "assigned" | "resolved";

export interface SosEvent {
  id: string;
  place: string;
  region: string;
  status: SosStatus;
  meta: string;
  lat: number;
  lng: number;
  priorityLabel?: string;
  battery?: number;
  meshHops?: number;
  receivedTime?: string;
  receivedDate?: string;
  accuracy?: string;
  elevation?: number;
  terrainLabel?: string;
  callerNote?: string;
  assignedTeam?: string | null;
  suggestedTeam?: {
    name: string;
    station: string;
    status: string;
    eta: string;
    capabilities: string;
  };
}

interface SosEventDetailProps {
  event?: SosEvent;
  onBack: () => void;
  onAssignTeam?: (eventId: string, teamName: string) => void;
  onResolve?: (eventId: string) => void;
}

const DEFAULT_EVENT: SosEvent = {
  id: "SOS-NEP-0842",
  priorityLabel: "Priority 1 · Immediate Review",
  place: "Lukla, Solukhumbu",
  region: "Khumbu",
  status: "pending",
  meta: "Received 14:27 · 2.8 km from Team Echo",
  battery: 38,
  meshHops: 4,
  receivedTime: "14:27",
  receivedDate: "28 Aug · NPT",
  accuracy: "±18m",
  lat: 27.6869,
  lng: 86.7314,
  elevation: 2860,
  terrainLabel: "Lukla east ridge · marked SOS location",
  callerNote:
    "Two trekkers separated near the east ridge. One has a suspected ankle injury. Weather is closing in; visibility is falling rapidly.",
  suggestedTeam: {
    name: "Team Echo",
    station: "Lukla Station · 2.8 km away",
    status: "Available",
    eta: "18 min",
    capabilities: "Rope Rescue · Trauma Care",
  },
};

function InfoStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="flex-1 px-5 py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        {icon}
        {sub}
      </p>
    </div>
  );
}

export default function SosEventDetail({
  event = DEFAULT_EVENT,
  onBack,
  onAssignTeam,
  onResolve,
}: SosEventDetailProps) {
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<SosStatus>(event.status);
  const [assignedTeam, setAssignedTeam] = useState<string | null>(
    event.assignedTeam ?? (event.status === "assigned" ? event.suggestedTeam?.name ?? "Team Echo" : null)
  );

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${event.lat}, ${event.lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAssign = () => {
    const teamName = event.suggestedTeam?.name ?? "Team Echo";
    setAssignedTeam(teamName);
    setCurrentStatus("assigned");
    if (onAssignTeam) onAssignTeam(event.id, teamName);
  };

  const handleResolve = () => {
    setCurrentStatus("resolved");
    if (onResolve) onResolve(event.id);
  };

  const statusHistory = [
    ...(currentStatus === "resolved"
      ? [
          {
            title: `Resolved by ${assignedTeam ?? "Rescue Unit"}`,
            meta: "Just now · Extraction confirmed safe",
            dot: "bg-emerald-500",
          },
        ]
      : []),
    ...(currentStatus === "assigned" || currentStatus === "resolved"
      ? [
          {
            title: `Assigned to ${assignedTeam ?? event.suggestedTeam?.name ?? "Team Echo"}`,
            meta: "Field team dispatched · ETA en route",
            dot: "bg-blue-500",
          },
        ]
      : [
          {
            title: "Awaiting team assignment",
            meta: `${event.receivedTime ?? "14:29"} NPT · Dispatcher queue`,
            dot: "bg-red-500",
          },
        ]),
    {
      title: "SOS validated by mesh relay",
      meta: `Mesh Hop 0${event.meshHops ?? 4} confirmed via LoRa relay`,
      dot: "bg-slate-400",
    },
    {
      title: "Distress beacon received",
      meta: `${event.receivedTime ?? "14:27"} NPT · GPS accuracy ${event.accuracy ?? "±18m"}`,
      dot: "bg-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="h-9 w-9 border-slate-200 hover:bg-slate-50"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-slate-400">Live Dispatch</p>
              <span className="text-xs text-slate-300">/</span>
              <p className="text-xs font-bold text-slate-900">{event.id}</p>
            </div>
            <h1 className="text-lg font-bold text-slate-900">SOS Incident Details</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge
            variant={
              currentStatus === "pending"
                ? "destructive"
                : currentStatus === "assigned"
                ? "info"
                : "success"
            }
            className="gap-1.5 px-3 py-1 text-xs font-bold capitalize"
          >
            {currentStatus === "pending" && <AlertTriangle className="h-3.5 w-3.5" />}
            {currentStatus === "assigned" && <UserCheck className="h-3.5 w-3.5" />}
            {currentStatus === "resolved" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {currentStatus === "pending" ? "Pending Triage" : currentStatus}
          </Badge>

          <Button
            variant="outline"
            className="gap-1.5 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Share2 className="h-4 w-4" />
            Share Brief
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[1fr_380px]">
        {/* ── Left column ────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Priority banner + telemetry row */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r from-red-50/50 via-white to-white border-b border-slate-100">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-red-600">
                    {event.priorityLabel ?? "Priority 1 · Immediate Review"}
                  </p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{event.id}</h2>
                  <p className="text-sm font-medium text-slate-500">
                    Incoming beacon from <span className="font-semibold text-slate-800">{event.place}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="tel:+9779800000000"
                  className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800"
                >
                  <Phone className="h-4 w-4" />
                  Call Field Relay
                </a>
              </div>
            </div>

            {/* Quick stats grid */}
            <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100 sm:grid-cols-4 bg-slate-50/30">
              <InfoStat
                icon={<BatteryLow className="h-3.5 w-3.5 text-red-500" />}
                label="Beacon Battery"
                value={`${event.battery ?? 38}%`}
                sub="Signal active"
              />
              <InfoStat
                icon={<Radio className="h-3.5 w-3.5 text-blue-500" />}
                label="Mesh Hops"
                value={String(event.meshHops ?? 4).padStart(2, "0")}
                sub="LoRa Relay Path"
              />
              <InfoStat
                icon={<Clock className="h-3.5 w-3.5 text-slate-500" />}
                label="Beacon Time"
                value={event.receivedTime ?? "14:27"}
                sub={event.receivedDate ?? "28 Aug · NPT"}
              />
              <InfoStat
                icon={<Crosshair className="h-3.5 w-3.5 text-emerald-500" />}
                label="GPS Accuracy"
                value={event.accuracy ?? "±18m"}
                sub="Satellite locked"
              />
            </div>
          </div>

          {/* Location & Terrain Live Map */}
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

            {/* Google Map Box */}
            <div className="relative mt-3 h-80 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-2xs">
              {apiKey ? (
                <APIProvider apiKey={apiKey}>
                  <Map
                    defaultCenter={{ lat: event.lat, lng: event.lng }}
                    defaultZoom={13}
                    mapId="aasha-sos-detail-map"
                    disableDefaultUI={false}
                    className="h-full w-full"
                  >
                    <AdvancedMarker position={{ lat: event.lat, lng: event.lng }}>
                      <div className="relative flex h-11 w-11 items-center justify-center">
                        <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-red-500/25" />
                        <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-red-600 shadow-lg text-white">
                          <AlertTriangle className="h-5 w-5" />
                        </span>
                      </div>
                    </AdvancedMarker>
                  </Map>
                </APIProvider>
              ) : (
                <div className="relative flex h-full w-full items-center justify-center bg-radial from-slate-100 to-slate-200 p-6 text-center">
                  <div className="relative flex h-12 w-12 items-center justify-center">
                    <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-red-500/20" />
                    <span className="relative flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                      <AlertTriangle className="h-5 w-5" />
                    </span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-md backdrop-blur">
                <Mountain className="h-4 w-4 text-slate-500" />
                {event.terrainLabel ?? "Khumbu valley · marked SOS beacon"}
              </div>
            </div>
          </div>

          {/* Caller Distress Message */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="mb-3 text-base font-bold text-slate-900">Distress Transmission Note</h3>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium italic leading-relaxed text-slate-700">
                &ldquo;{event.callerNote ?? "Emergency assistance requested. Trekkers require immediate coordination and medical support."}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* ── Right column ───────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Rescue Team Assignment Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Rescue Team Dispatch</h3>
                <p className="text-xs text-slate-500">Nearest capable field team</p>
              </div>
              {assignedTeam && (
                <Badge variant="info" className="text-[10px] font-bold">
                  Assigned
                </Badge>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold shadow-2xs">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {assignedTeam ?? event.suggestedTeam?.name ?? "Team Echo"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {event.suggestedTeam?.station ?? "Lukla Station · 2.8 km away"}
                    </p>
                  </div>
                </div>
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {event.suggestedTeam?.status ?? "Available"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Estimated ETA</p>
                  <p className="text-base font-bold text-slate-900">
                    {event.suggestedTeam?.eta ?? "18 min"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-2xs">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">Capabilities</p>
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {event.suggestedTeam?.capabilities ?? "Rope · Trauma"}
                  </p>
                </div>
              </div>
            </div>

            {currentStatus === "pending" ? (
              <Button
                onClick={handleAssign}
                className="mt-4 w-full gap-2 bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-xs"
              >
                Dispatch {event.suggestedTeam?.name ?? "Team Echo"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : currentStatus === "assigned" ? (
              <div className="mt-4 space-y-2">
                <Button
                  onClick={handleResolve}
                  className="w-full gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Mission as Resolved
                </Button>
                <Button
                  variant="outline"
                  render={<Link href="/rescue-team" />}
                  className="w-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  View All Rescue Teams
                </Button>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
                Mission successfully closed &amp; resolved.
              </div>
            )}
          </div>

          {/* Status Timeline History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="mb-4 text-base font-bold text-slate-900">Incident Event Log</h3>
            <div className="flex flex-col gap-4">
              {statusHistory.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.dot}`} />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.title}</p>
                    <p className="text-[11px] text-slate-500">{item.meta}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Escalation Guidance */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-xs">
            <div className="mb-1.5 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900">Emergency Protocol</h3>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              If voice or LoRa confirmation is not established within 15 minutes of dispatch, escalate to high-altitude helicopter extraction command.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}