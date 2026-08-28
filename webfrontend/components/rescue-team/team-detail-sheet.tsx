"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Availability, RescueTeam } from "./rescue-map";
import {
  Shield,
  MapPin,
  Phone,
  Users,
  Activity,
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
} from "lucide-react";

interface TeamDetailSheetProps {
  team: RescueTeam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateStatus?: (teamId: string, status: Availability) => void;
}

export function TeamDetailSheet({
  team,
  open,
  onOpenChange,
  onUpdateStatus,
}: TeamDetailSheetProps) {
  if (!team) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-base font-bold text-white shadow-xs">
              {team.initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{team.name}</SheetTitle>
                <Badge
                  variant={
                    team.availability === "available"
                      ? "success"
                      : team.availability === "deployed"
                      ? "info"
                      : "secondary"
                  }
                  className="capitalize font-bold"
                >
                  {team.availability}
                </Badge>
              </div>
              <SheetDescription className="flex items-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {team.station}, {team.district}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Team Readiness</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {team.readiness !== null ? `${team.readiness}%` : "--"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
              <p className="text-[11px] font-semibold uppercase text-slate-400">Active Members</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {team.membersCount} Crew
              </p>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Capabilities & Equipment
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
              <p className="font-medium">{team.capability}</p>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Field Command
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Team Leader</span>
                <span className="font-semibold text-slate-900">{team.lead}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="text-slate-500">Emergency Phone</span>
                <a
                  href={`tel:${team.phone}`}
                  className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {team.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Current Assignment */}
          {team.assignment && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Active Assignment
              </h4>
              <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-blue-900">{team.assignment}</span>
                  </div>
                  <Badge variant="info">In Progress</Badge>
                </div>
              </div>
            </div>
          )}

          {/* Status Changer */}
          {onUpdateStatus && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Update Status
              </h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={team.availability === "available" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateStatus(team.id, "available")}
                  className={team.availability === "available" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                >
                  Available
                </Button>
                <Button
                  variant={team.availability === "deployed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateStatus(team.id, "deployed")}
                  className={team.availability === "deployed" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}
                >
                  Deployed
                </Button>
                <Button
                  variant={team.availability === "off-duty" ? "default" : "outline"}
                  size="sm"
                  onClick={() => onUpdateStatus(team.id, "off-duty")}
                >
                  Off-Duty
                </Button>
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="border-t border-slate-100 p-4 bg-slate-50">
          <a
            href={`tel:${team.phone}`}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <Phone className="h-4 w-4" />
            Dispatch Direct Call
          </a>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

