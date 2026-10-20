"use client";

import React, { useState, useEffect } from "react";
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
  CheckCircle2,
  UserCheck,
  Truck,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SOSMapPanel } from "@/components/sos/SOSMapPanel";
import { SOSDispatchPanel } from "@/components/sos/SOSDispatchPanel";

export type SosStatus = "pending" | "assigned" | "en_route" | "on_scene" | "false_alarm" | "resolved";

export interface SosEvent {
  id: string;
  place: string;
  region: string;
  status: SosStatus;
  meta: string;
  lat?: number;
  lng?: number;
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
  // New profile fields
  name?: string;
  address?: string;
  email?: string;
  phone?: string;
  bloodGroup?: string;
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

function InfoStat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string; }) {
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

import BACKEND_URL from "@/lib/config";

const BACKEND = BACKEND_URL;


export default function SosEventDetail({
  event = DEFAULT_EVENT,
  onBack,
  onAssignTeam,
  onResolve,
}: SosEventDetailProps) {
  const [currentStatus, setCurrentStatus] = useState<SosStatus>(event.status);
  const [assignedTeam, setAssignedTeam] = useState<string | null>(
    // Use the real team name stored on the event (set by dispatch endpoint)
    event.assignedTeam ?? null
  );
  const [nearestTeam, setNearestTeam] = useState<any>(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  useEffect(() => {
    if (currentStatus !== "pending") return;
    const fetchNearest = async () => {
      try {
        setLoadingTeam(true);
        const res = await fetch(`${BACKEND}/api/dispatch/nearest?lat=${event.lat}&lng=${event.lng}`);
        const data = await res.json();
        if (data?.team) setNearestTeam(data.team);
      } catch (err) {
        console.error("Failed to fetch nearest team:", err);
      } finally {
        setLoadingTeam(false);
      }
    };
    fetchNearest();
  }, [event.lat, event.lng, currentStatus]);

  const handleAssign = async () => {
    if (!nearestTeam) return;
    try {
      setDispatching(true);
      const res = await fetch(`${BACKEND}/api/dispatch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sosId: event.id, lat: event.lat, lng: event.lng, place: event.place,
          callerNote: event.callerNote, battery: event.battery, meshHops: event.meshHops, receivedTime: event.receivedTime,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        const teamName = data.dispatchedTeam?.teamName || nearestTeam.teamName;
        setAssignedTeam(teamName);
        setCurrentStatus("assigned");
        setDispatchResult({ emailsSent: data.emailsSent || [], emailsFailed: data.emailsFailed || [] });
        if (onAssignTeam) onAssignTeam(event.id, teamName);
      }
    } catch (err) {
      console.error("Dispatch failed:", err);
    } finally {
      setDispatching(false);
    }
  };

  const handleResolveAction = () => {
    setCurrentStatus("resolved");
    if (onResolve) onResolve(event.id);
  };

  const resolvedByLabel  = assignedTeam ?? "Rescue Unit";
  const assignedToLabel  = assignedTeam ?? (event.status === "assigned" || event.status === "en_route" || event.status === "on_scene" || event.status === "false_alarm" ? "Rescue Team" : "Unknown Team");

  const statusHistory = [
    ...(currentStatus === "resolved"
      ? [{ title: `Resolved by ${resolvedByLabel}`, meta: "Extraction confirmed safe", dot: "bg-emerald-500" }]
      : currentStatus === "false_alarm"
      ? [{ title: `False alarm — no response needed`, meta: "Incident cleared by team", dot: "bg-amber-500" }]
      : []),
    ...(currentStatus === "on_scene" || currentStatus === "resolved"
      ? [{ title: `Team on scene`, meta: "Field team arrived at location", dot: "bg-blue-500" }]
      : []),
    ...(currentStatus === "en_route" || currentStatus === "on_scene" || currentStatus === "resolved"
      ? [{ title: `En route to location`, meta: "Field team dispatched · traveling to scene", dot: "bg-orange-400" }]
      : []),
    ...(currentStatus === "en_route" || currentStatus === "on_scene" || currentStatus === "resolved"
      ? [{ title: `Assigned to ${assignedToLabel}`, meta: "Field team dispatched · ETA en route", dot: "bg-blue-500" }]
      : [{ title: "Awaiting team assignment", meta: `${event.receivedTime ?? "--:--"} NPT · Dispatcher queue`, dot: "bg-red-500" }]),
    { title: "SOS validated by mesh relay", meta: `Mesh Hop ${String(event.meshHops ?? 0).padStart(2, "0")} confirmed via LoRa relay`, dot: "bg-slate-400" },
    { title: "Distress beacon received", meta: `${event.receivedTime ?? "--:--"} NPT · GPS accuracy ${event.accuracy ?? "±15m"}`, dot: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={onBack} className="h-9 w-9 border-slate-200 hover:bg-slate-50">
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
          <Badge variant={currentStatus === "pending" ? "destructive" : (currentStatus === "assigned" || currentStatus === "en_route" || currentStatus === "on_scene") ? "info" : currentStatus === "false_alarm" ? "warning" : "success"} className="gap-1.5 px-3 py-1 text-xs font-bold capitalize">
            {currentStatus === "pending" && <AlertTriangle className="h-3.5 w-3.5" />}
            {currentStatus === "assigned" && <UserCheck className="h-3.5 w-3.5" />}
            {currentStatus === "en_route" && <Truck className="h-3.5 w-3.5" />}
            {currentStatus === "on_scene" && <MapPin className="h-3.5 w-3.5" />}
            {currentStatus === "false_alarm" && <AlertTriangle className="h-3.5 w-3.5" />}
            {currentStatus === "resolved" && <CheckCircle2 className="h-3.5 w-3.5" />}
            {currentStatus === "pending" ? "Pending Triage" : currentStatus === "en_route" ? "En Route" : currentStatus === "on_scene" ? "On Scene" : currentStatus === "false_alarm" ? "False Alarm" : currentStatus === "assigned" ? "Team Assigned" : currentStatus === "resolved" ? "Resolved" : currentStatus}
          </Badge>
          <Button variant="outline" className="gap-1.5 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
            <Share2 className="h-4 w-4" /> Share Brief
          </Button>
        </div>
      </header>

      <main className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-5">
          {/* Priority banner + telemetry */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className={`flex flex-wrap items-center justify-between gap-4 p-5 bg-gradient-to-r ${currentStatus === "resolved" ? "from-emerald-50/50" : currentStatus === "false_alarm" ? "from-amber-50/50" : currentStatus === "on_scene" ? "from-purple-50/50" : currentStatus === "en_route" ? "from-orange-50/50" : currentStatus === "assigned" ? "from-blue-50/50" : "from-red-50/50"} via-white to-white border-b border-slate-100`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${currentStatus === "resolved" ? "bg-emerald-600" : currentStatus === "false_alarm" ? "bg-amber-600" : currentStatus === "on_scene" ? "bg-purple-600" : currentStatus === "en_route" ? "bg-orange-600" : currentStatus === "assigned" ? "bg-blue-600" : "bg-red-600"}`}>
                  {currentStatus === "resolved" ? <CheckCircle2 className="h-6 w-6" /> : currentStatus === "false_alarm" ? <AlertTriangle className="h-6 w-6" /> : currentStatus === "on_scene" ? <MapPin className="h-6 w-6" /> : currentStatus === "en_route" ? <Truck className="h-6 w-6" /> : currentStatus === "assigned" ? <UserCheck className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${currentStatus === "resolved" ? "text-emerald-600" : currentStatus === "false_alarm" ? "text-amber-600" : currentStatus === "on_scene" ? "text-purple-600" : currentStatus === "en_route" ? "text-orange-600" : currentStatus === "assigned" ? "text-blue-600" : "text-red-600"}`}>
                    {currentStatus === "resolved" ? "Resolved · Mission Complete" : currentStatus === "false_alarm" ? "False Alarm · Cleared" : currentStatus === "on_scene" ? "Priority 4 · On Scene" : currentStatus === "en_route" ? "Priority 3 · Team En Route" : currentStatus === "assigned" ? "Priority 2 · Unit En Route" : event.priorityLabel ?? "Priority 1 · Immediate Review"}
                  </p>
                  <h2 className="text-2xl font-extrabold text-slate-900">{event.id}</h2>
                  <p className="text-sm font-medium text-slate-500">Incoming beacon from <span className="font-semibold text-slate-800">{event.place}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href="tel:+9779800000000" className="flex shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800">
                  <Phone className="h-4 w-4" /> Call Field Relay
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 divide-slate-100 border-t border-slate-100 sm:grid-cols-4 bg-slate-50/30">
              <InfoStat icon={<BatteryLow className="h-3.5 w-3.5 text-red-500" />} label="Beacon Battery" value={`${event.battery ?? 38}%`} sub="Signal active" />
              <InfoStat icon={<Radio className="h-3.5 w-3.5 text-blue-500" />} label="Mesh Hops" value={String(event.meshHops ?? 4).padStart(2, "0")} sub="LoRa Relay Path" />
              <InfoStat icon={<Clock className="h-3.5 w-3.5 text-slate-500" />} label="Beacon Time" value={event.receivedTime ?? "14:27"} sub={event.receivedDate ?? "28 Aug · NPT"} />
              <InfoStat icon={<Crosshair className="h-3.5 w-3.5 text-emerald-500" />} label="GPS Accuracy" value={event.accuracy ?? "±18m"} sub="Satellite locked" />
            </div>
          </div>

          {/* Map panel */}
          <SOSMapPanel event={event} currentStatus={currentStatus} />

          {/* Profile Details Section */}
           {(event.name || event.address || event.email || event.phone || event.bloodGroup) && (
             <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
               <h3 className="mb-3 text-base font-bold text-slate-900">User Profile Details</h3>
               <ul className="list-none space-y-2 text-sm text-slate-700">
                 {event.name && <li><strong>Name:</strong> {event.name}</li>}
                 {event.address && <li><strong>Address:</strong> {event.address}</li>}
                 {event.email && <li><strong>Email:</strong> {event.email}</li>}
                 {event.phone && <li><strong>Phone:</strong> {event.phone}</li>}
                 {event.bloodGroup && <li><strong>Blood Group:</strong> {event.bloodGroup}</li>}
               </ul>
             </div>
           )}

           {event.callerNote && event.callerNote.trim().length > 0 && (
             <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
               <div className="mb-3 flex items-center gap-2">
                 <AlertTriangle className="h-4 w-4 text-amber-600" />
                 <h3 className="text-base font-bold text-slate-900">Disaster Note</h3>
               </div>
               <p className="text-sm text-slate-700 leading-relaxed">{event.callerNote}</p>
             </div>
           )}

         </div>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          <SOSDispatchPanel
            currentStatus={currentStatus}
            loadingTeam={loadingTeam}
            nearestTeam={nearestTeam}
            assignedTeam={assignedTeam}
            dispatching={dispatching}
            dispatchResult={dispatchResult}
            handleAssign={handleAssign}
            handleResolve={handleResolveAction}
          />

          {/* History */}
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
