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
  CheckCircle2,
  Clock,
  Radio,
  ExternalLink,
  Mail,
  CreditCard,
  FileText,
  Download,
  Building2,
  Zap,
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

  // Escape a single CSV cell value
  const csv = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const handleExportDossier = () => {
    const now = new Date().toLocaleString("en-NP", { timeZone: "Asia/Kathmandu" });
    const safe = (v: any) => String(v ?? "").replace(/"/g, '""');

    const rows: string[] = [];

    // ── SECTION 1: Team Identity ──────────────────────────────────────────────
    rows.push(csv("AASHA RESCUE SYSTEM — RESCUE TEAM DOSSIER"));
    rows.push(`${csv("Generated")},${csv(now + " NPT")}`);
    rows.push("");
    rows.push(`${csv("=== SECTION 1: TEAM IDENTITY ===")}`);
    rows.push(`${csv("Field")},${csv("Value")}`);
    rows.push(`${csv("Team Name")},${csv(team.name)}`);
    rows.push(`${csv("Base Station")},${csv(team.station)}`);
    rows.push(`${csv("District")},${csv(team.district)}`);
    rows.push(`${csv("Province")},${csv(team.province || "—")}`);
    rows.push(`${csv("Operational Status")},${csv(team.availability.toUpperCase())}`);
    rows.push(`${csv("Readiness %")},${csv(team.readiness !== null ? team.readiness + "%" : "—")}`);
    rows.push(`${csv("Total Members (incl. Leader)")},${csv(team.membersCount)}`);
    rows.push(`${csv("Current Assignment")},${csv(team.assignment || "None")}`);
    rows.push("");

    // ── SECTION 2: Team Commander ─────────────────────────────────────────────
    rows.push(`${csv("=== SECTION 2: TEAM COMMANDER ===")}`);
    rows.push(`${csv("Field")},${csv("Value")}`);
    rows.push(`${csv("Leader Name")},${csv(team.lead)}`);
    rows.push(`${csv("Email / Gmail")},${csv(team.leadEmail || "—")}`);
    rows.push(`${csv("Phone")},${csv(team.phone)}`);
    rows.push(`${csv("Citizenship Number")},${csv(team.leadCitizenshipNumber || "—")}`);
    rows.push(`${csv("Citizenship Doc URL")},${csv(team.leadCitizenshipDocUrl || "Not uploaded")}`);
    rows.push(`${csv("Official Team Letter URL")},${csv(team.teamLetterDocUrl || "Not uploaded")}`);
    rows.push("");

    // ── SECTION 3: Capabilities ───────────────────────────────────────────────
    const caps = team.capabilities && team.capabilities.length > 0
      ? team.capabilities
      : team.capability.split(" · ").filter(Boolean);
    rows.push(`${csv("=== SECTION 3: SPECIALIZED CAPABILITIES (" + caps.length + ") ===")}`);
    rows.push(`${csv("#")},${csv("Capability")}`);
    caps.forEach((cap, i) => {
      rows.push(`${csv(i + 1)},${csv(cap)}`);
    });
    rows.push("");

    // ── SECTION 4: Team Members Roster ───────────────────────────────────────
    const members = team.members || [];
    rows.push(`${csv("=== SECTION 4: TEAM MEMBERS ROSTER (" + (members.length + 1) + " incl. Leader) ===")}`);
    rows.push([
      csv("#"),
      csv("Full Name"),
      csv("Role"),
      csv("Email / Gmail"),
      csv("Phone Number"),
      csv("Citizenship Number"),
      csv("Citizenship Doc URL"),
      csv("Type"),
    ].join(","));

    // Leader row first
    rows.push([
      csv(1),
      csv(team.lead),
      csv("Team Leader / Commander"),
      csv(team.leadEmail || "—"),
      csv(team.phone),
      csv(team.leadCitizenshipNumber || "—"),
      csv(team.leadCitizenshipDocUrl || "Not uploaded"),
      csv("LEADER"),
    ].join(","));

    // All other members
    members.forEach((m, i) => {
      rows.push([
        csv(i + 2),
        csv(m.name || `Member ${i + 1}`),
        csv(m.role || "Field Responder"),
        csv(m.email || "—"),
        csv(m.phone || "—"),
        csv(m.citizenshipNumber || "—"),
        csv(m.citizenshipDocUrl || "Not uploaded"),
        csv("MEMBER"),
      ].join(","));
    });
    rows.push("");

    // ── FOOTER ────────────────────────────────────────────────────────────────
    rows.push(csv("Aasha Emergency Response System · Government of Nepal · Confidential"));

    // BOM + CSV content for Excel compatibility
    const csvContent = "\uFEFF" + rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${team.name.replace(/\s+/g, "-")}-team-dossier.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="border-b border-slate-100 p-5 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white shadow-sm">
              {team.initial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <SheetTitle className="text-lg font-black">{team.name}</SheetTitle>
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
              <SheetDescription className="flex items-center gap-1 mt-0.5 text-xs">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {team.station}, {team.district}
                {team.province ? ` · ${team.province}` : ""}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/30">

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Readiness
              </p>
              <p className={`mt-1 text-xl font-black ${
                team.readiness === null ? "text-slate-400" :
                team.readiness >= 90 ? "text-emerald-700" :
                team.readiness >= 70 ? "text-amber-700" : "text-red-700"
              }`}>
                {team.readiness !== null ? `${team.readiness}%` : "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Crew Size
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">{team.membersCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-center">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                Capabilities
              </p>
              <p className="mt-1 text-xl font-black text-slate-900">
                {(team.capabilities || []).length || "—"}
              </p>
            </div>
          </div>

          {/* Active Assignment */}
          {team.assignment && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-blue-600" />
                  <span className="font-bold text-blue-900">{team.assignment}</span>
                </div>
                <Badge variant="info">In Progress</Badge>
              </div>
            </div>
          )}

          {/* Capabilities */}
          {(team.capabilities && team.capabilities.length > 0) && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Specialized Capabilities
              </h4>
              <div className="flex flex-wrap gap-2">
                {team.capabilities.map((cap) => (
                  <span
                    key={cap}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    ✓ {cap}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Team Commander */}
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Team Commander
            </h4>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Shield className="h-3.5 w-3.5" /> Name
                </span>
                <span className="font-bold text-slate-900">{team.lead}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
                <a
                  href={`tel:${team.phone}`}
                  className="font-semibold text-blue-600 hover:underline"
                >
                  {team.phone}
                </a>
              </div>
              {team.leadEmail && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="h-3.5 w-3.5" /> Email
                  </span>
                  <a
                    href={`mailto:${team.leadEmail}`}
                    className="font-semibold text-blue-600 hover:underline text-xs"
                  >
                    {team.leadEmail}
                  </a>
                </div>
              )}
              {team.leadCitizenshipNumber && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <CreditCard className="h-3.5 w-3.5" /> Citizenship
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {team.leadCitizenshipNumber}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Verified Documents */}
          {(team.leadCitizenshipDocUrl || team.teamLetterDocUrl) && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Verified Documents (Cloudinary)
              </h4>
              <div className="flex flex-wrap gap-2">
                {team.leadCitizenshipDocUrl && (
                  <a
                    href={team.leadCitizenshipDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Leader Citizenship
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {team.teamLetterDocUrl && (
                  <a
                    href={team.teamLetterDocUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-bold text-purple-700 hover:bg-purple-100"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Official Team Letter
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Team Members Roster */}
          {team.members && team.members.length > 0 && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Team Members ({team.members.length})
              </h4>
              <div className="space-y-2">
                {team.members.map((member, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                          {(member.name || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {member.name || `Member ${idx + 1}`}
                          </p>
                          <p className="text-slate-500 truncate">{member.role || "Field Responder"}</p>
                        </div>
                      </div>
                      {member.citizenshipDocUrl && (
                        <a
                          href={member.citizenshipDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
                        >
                          <CreditCard className="h-3 w-3" /> ID
                        </a>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-9 text-[11px] text-slate-500">
                      {member.email && (
                        <a
                          href={`mailto:${member.email}`}
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Mail className="h-3 w-3" /> {member.email}
                        </a>
                      )}
                      {member.phone && (
                        <a
                          href={`tel:${member.phone}`}
                          className="flex items-center gap-1 hover:underline"
                        >
                          <Phone className="h-3 w-3" /> {member.phone}
                        </a>
                      )}
                      {member.citizenshipNumber && (
                        <span className="flex items-center gap-1 font-mono">
                          <CreditCard className="h-3 w-3" /> {member.citizenshipNumber}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Changer */}
          {onUpdateStatus && (
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Update Operational Status
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

        {/* Footer Actions */}
        <SheetFooter className="border-t border-slate-100 p-4 bg-white flex flex-col gap-2">
          <div className="flex gap-2 w-full">
            <a
              href={`tel:${team.phone}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
            >
              <Phone className="h-4 w-4" />
              Dispatch Call
            </a>
            <button
              onClick={handleExportDossier}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export Dossier
            </button>
          </div>
          {team.leadEmail && (
            <a
              href={`mailto:${team.leadEmail}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Mail className="h-3.5 w-3.5" />
              Email Commander — {team.leadEmail}
            </a>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
