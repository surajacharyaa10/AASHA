"use client";

import Link from "next/link";
import { CheckCircle2, ArrowRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SosStatus } from "@/app/components/SOSDetails";

interface NearestTeam {
  id: string;
  teamName: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  station: string;
  district: string;
  province: string;
  distanceKm: number;
  etaMinutes: number;
  capabilities: string[];
  members: Array<{ name: string; email: string; phone: string; role: string }>;
}

interface SOSDispatchPanelProps {
  currentStatus: SosStatus;
  loadingTeam: boolean;
  nearestTeam: NearestTeam | null;
  assignedTeam: string | null;
  dispatching: boolean;
  dispatchResult: { emailsSent: string[]; emailsFailed: string[] } | null;
  handleAssign: () => void;
  handleResolve: () => void;
}

export function SOSDispatchPanel({
  currentStatus,
  loadingTeam,
  nearestTeam,
  assignedTeam,
  dispatching,
  dispatchResult,
  handleAssign,
  handleResolve,
}: SOSDispatchPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900">Rescue Team Dispatch</h3>
          <p className="text-xs text-slate-500">
            {loadingTeam
              ? "Scanning nearest available teams..."
              : nearestTeam
              ? `Auto-selected · ${nearestTeam.distanceKm} km away`
              : assignedTeam
              ? "Team successfully dispatched"
              : "No approved teams in system"}
          </p>
        </div>
        {assignedTeam && (
          <Badge variant="info" className="text-[10px] font-bold">
            Dispatched
          </Badge>
        )}
      </div>

      {/* Loading skeleton */}
      {loadingTeam && currentStatus === "pending" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-slate-200" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-3 bg-slate-200 rounded w-2/3" />
            </div>
          </div>
          <div className="h-8 bg-slate-200 rounded-xl w-full" />
        </div>
      )}

      {/* Nearest Team Info */}
      {!loadingTeam && nearestTeam && currentStatus === "pending" && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold text-base shadow-2xs">
                {nearestTeam.teamName.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-slate-900">{nearestTeam.teamName}</p>
                <p className="text-xs text-slate-500">
                  {nearestTeam.station}, {nearestTeam.district}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Available
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">ETA</p>
              <p className="text-sm font-bold text-slate-900">{nearestTeam.etaMinutes} min</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-2xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Distance</p>
              <p className="text-sm font-bold text-slate-900">{nearestTeam.distanceKm} km</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-1">
            {nearestTeam.capabilities.slice(0, 3).map((cap) => (
              <span
                key={cap}
                className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
              >
                {cap}
              </span>
            ))}
            {nearestTeam.capabilities.length > 3 && (
              <span className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                +{nearestTeam.capabilities.length - 3} more
              </span>
            )}
          </div>

          {/* All recipients preview */}
          <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2">
            <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">📧 Dispatch emails will go to:</p>
            <div className="space-y-0.5">
              <p className="text-[11px] font-semibold text-blue-900">
                {nearestTeam.leadName} (Commander) — {nearestTeam.leadEmail}
              </p>
              {nearestTeam.members.filter(m => m.email && m.email !== "—").map((m, i) => (
                <p key={i} className="text-[11px] text-blue-700">
                  {m.name} — {m.email}
                </p>
              ))}
            </div>
          </div>

          <Button
            onClick={handleAssign}
            disabled={dispatching}
            className="w-full gap-2 bg-blue-600 font-bold text-white hover:bg-blue-700 shadow-xs"
          >
            {dispatching ? (
              <>
                <Activity className="h-4 w-4 animate-spin" />
                Dispatching & Sending Emails…
              </>
            ) : (
              <>
                Dispatch {nearestTeam.teamName}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* No teams available */}
      {!loadingTeam && !nearestTeam && currentStatus === "pending" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-xs font-bold text-amber-800">🚫 No available rescue teams</p>
          <p className="text-[11px] text-amber-600 mt-1">
            All approved teams are currently deployed on active missions. Wait for a team to become available or approve new team registrations.
          </p>
        </div>
      )}

      {/* Already assigned / dispatched */}
      {(currentStatus === "assigned" || currentStatus === "en_route" || currentStatus === "on_scene") && (
        <div className="space-y-3">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3">
            <p className="text-xs font-bold text-blue-900">
              {currentStatus === "en_route" ? "🚐 En route to scene" : currentStatus === "on_scene" ? "📍 On scene" : "✅ "} {assignedTeam} has been dispatched
            </p>
            {dispatchResult && (
              <p className="text-[11px] text-blue-700 mt-1">
                📧 Emails sent to {dispatchResult.emailsSent.length} team member(s)
                {dispatchResult.emailsFailed.length > 0 &&
                  ` · ${dispatchResult.emailsFailed.length} failed`}
              </p>
            )}
          </div>
          {currentStatus !== "on_scene" && (
          <Button
            onClick={handleResolve}
            className="w-full gap-2 bg-emerald-600 font-bold text-white hover:bg-emerald-700 shadow-xs"
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Mission as Resolved
          </Button>
          )}
          <Button
            variant="outline"
            render={<Link href="/rescue-team" />}
            className="w-full border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            View All Rescue Teams
          </Button>
        </div>
      )}

      {currentStatus === "false_alarm" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-xs font-bold text-amber-800">
          🚨 False alarm — incident cleared. No field response required.
        </div>
      )}

      {currentStatus === "resolved" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-800">
          Mission successfully closed &amp; resolved.
        </div>
      )}
    </div>
  );
}
