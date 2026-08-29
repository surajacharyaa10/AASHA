"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Download, List, Map as MapIcon, Users, RefreshCw, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RescueMap, RescueTeam, Availability } from "@/components/rescue-team/rescue-map";
import { TeamDetailSheet } from "@/components/rescue-team/team-detail-sheet";
import { TeamMetrics } from "@/components/rescue-team/TeamMetrics";
import { TeamFilterBar } from "@/components/rescue-team/TeamFilterBar";
import { TeamTable } from "@/components/rescue-team/TeamTable";

const BACKEND_URL = "http://localhost:4000";

const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  "Koshi Province":     { lat: 27.34, lng: 87.27 },
  "Madhesh Province":   { lat: 26.75, lng: 85.92 },
  "Bagmati Province":   { lat: 27.71, lng: 85.33 },
  "Gandaki Province":   { lat: 28.26, lng: 83.96 },
  "Lumbini Province":   { lat: 27.83, lng: 82.79 },
  "Karnali Province":   { lat: 29.18, lng: 82.17 },
  "Sudurpashchim Province": { lat: 29.30, lng: 80.55 },
};

function mapRegistrationToTeam(reg: any, idx: number): RescueTeam {
  const coords = PROVINCE_COORDS[reg.province] || { lat: 27.75, lng: 86.65 };
  const latOffset = (idx % 5) * 0.04 - 0.08;
  const lngOffset = (Math.floor(idx / 5) % 5) * 0.05 - 0.10;

  return {
    id: reg.id || reg._id,
    name: reg.teamName,
    initial: (reg.teamName || "T").charAt(0).toUpperCase(),
    capability: Array.isArray(reg.capabilities) ? reg.capabilities.join(" · ") : "General Rescue",
    station: reg.station,
    district: reg.district,
    province: reg.province,
    lead: reg.leadName,
    phone: reg.leadPhone,
    leadEmail: reg.leadEmail,
    leadCitizenshipNumber: reg.leadCitizenshipNumber,
    leadCitizenshipDocUrl: reg.leadCitizenshipDocUrl,
    teamLetterDocUrl: reg.teamLetterDocUrl,
    membersCount: reg.membersCount || (reg.members?.length || 0) + 1,
    members: reg.members || [],
    capabilities: reg.capabilities || [],
    availability: reg.availability || "available",
    assignment: reg.assignment || null,
    readiness: reg.readiness !== undefined ? reg.readiness : 100,
    lat: coords.lat + latOffset,
    lng: coords.lng + lngOffset,
    registrationId: reg.id,
  };
}

export default function RescueTeamRoster() {
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Availability>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/team-registrations?status=approved`);
      const data = await res.json();
      if (data?.registrations) {
        setTeams(data.registrations.map(mapRegistrationToTeam));
      }
    } catch (err) {
      console.error("Failed to load rescue teams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const availableCount = teams.filter((t) => t.availability === "available").length;
  const deployedCount = teams.filter((t) => t.availability === "deployed").length;
  const offDutyCount = teams.filter((t) => t.availability === "off-duty").length;

  const districts = useMemo(() => {
    const set = new Set(teams.map((t) => t.district));
    return Array.from(set);
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesQuery =
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.station.toLowerCase().includes(query.toLowerCase()) ||
        t.capability.toLowerCase().includes(query.toLowerCase()) ||
        t.lead.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.availability === statusFilter;
      const matchesDistrict = selectedDistrict === "all" || t.district === selectedDistrict;
      return matchesQuery && matchesStatus && matchesDistrict;
    });
  }, [teams, query, statusFilter, selectedDistrict]);

  const handleUpdateStatus = (teamId: string, status: Availability) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            availability: status,
            assignment: status === "deployed" ? "SOS-NEP-ASSIGNED" : null,
            readiness: status === "off-duty" ? null : t.readiness ?? 90,
          };
        }
        return t;
      })
    );
    if (selectedTeam && selectedTeam.id === teamId) {
      setSelectedTeam((prev) => prev ? {
        ...prev,
        availability: status,
        assignment: status === "deployed" ? "SOS-NEP-ASSIGNED" : null,
        readiness: status === "off-duty" ? null : prev.readiness ?? 90,
      } : null);
    }
  };

  const handleRowClick = (team: RescueTeam) => {
    setSelectedTeam(team);
    setIsDetailOpen(true);
  };

  const handleOpenDetails = (team: RescueTeam, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeam(team);
    setIsDetailOpen(true);
  };

  const csvCell = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;

  const handleExportTeam = (team: RescueTeam, e: React.MouseEvent) => {
    e.stopPropagation();
    const now = new Date().toLocaleString("en-NP", { timeZone: "Asia/Kathmandu" });
    const c = csvCell;
    const rows: string[] = [];

    rows.push(c("AASHA RESCUE SYSTEM — RESCUE TEAM DOSSIER SPREADSHEET"));
    rows.push(`${c("Generated")},${c(now + " NPT")}`);
    rows.push("");
    rows.push(c("=== SECTION 1: TEAM IDENTITY ==="));
    rows.push(`${c("Field")},${c("Value")}`);
    rows.push(`${c("Team Name")},${c(team.name)}`);
    rows.push(`${c("Base Station")},${c(team.station)}`);
    rows.push(`${c("District")},${c(team.district)}`);
    rows.push(`${c("Province")},${c(team.province || "—")}`);
    rows.push(`${c("Operational Status")},${c(team.availability.toUpperCase())}`);
    rows.push(`${c("Readiness %")},${c(team.readiness !== null ? team.readiness + "%" : "—")}`);
    rows.push(`${c("Total Members (incl. Leader)")},${c(team.membersCount)}`);
    rows.push(`${c("Current Assignment")},${c(team.assignment || "None")}`);
    rows.push("");
    rows.push(c("=== SECTION 2: TEAM COMMANDER ==="));
    rows.push(`${c("Field")},${c("Value")}`);
    rows.push(`${c("Leader Name")},${c(team.lead)}`);
    rows.push(`${c("Email / Gmail")},${c(team.leadEmail || "—")}`);
    rows.push(`${c("Phone")},${c(team.phone)}`);
    rows.push(`${c("Citizenship Number")},${c(team.leadCitizenshipNumber || "—")}`);
    rows.push(`${c("Citizenship Doc URL")},${c(team.leadCitizenshipDocUrl || "Not uploaded")}`);
    rows.push(`${c("Official Team Letter URL")},${c(team.teamLetterDocUrl || "Not uploaded")}`);
    rows.push("");
    const caps = team.capabilities && team.capabilities.length > 0 ? team.capabilities : team.capability.split(" · ").filter(Boolean);
    rows.push(c("=== SECTION 3: SPECIALIZED CAPABILITIES ==="));
    rows.push(`${c("#")},${c("Capability")}`);
    caps.forEach((cap, i) => rows.push(`${c(i + 1)},${c(cap)}`));
    rows.push("");
    const members = team.members || [];
    rows.push(c("=== SECTION 4: TEAM MEMBERS ROSTER ==="));
    rows.push([c("#"), c("Full Name"), c("Role"), c("Email / Gmail"), c("Phone Number"), c("Citizenship Number"), c("Citizenship Doc URL"), c("Type")].join(","));
    rows.push([c(1), c(team.lead), c("Team Leader / Commander"), c(team.leadEmail || "—"), c(team.phone), c(team.leadCitizenshipNumber || "—"), c(team.leadCitizenshipDocUrl || "Not uploaded"), c("LEADER")].join(","));
    members.forEach((m, i) => {
      rows.push([c(i + 2), c(m.name || `Member ${i + 1}`), c(m.role || "Field Responder"), c(m.email || "—"), c(m.phone || "—"), c(m.citizenshipNumber || "—"), c(m.citizenshipDocUrl || "Not uploaded"), c("MEMBER")].join(","));
    });
    rows.push("");
    rows.push(c("Aasha Emergency Response System · Government of Nepal · Confidential"));

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${team.name.replace(/\s+/g, "-")}-dossier.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportBrief = () => {
    const now = new Date().toISOString().split("T")[0];
    const rows = [
      ["ID", "Team Name", "Province", "District", "Base Station", "Leader", "Leader Email", "Phone", "Members", "Capabilities", "Status", "Assignment", "Readiness %"],
      ...teams.map((t) => [t.id, t.name, t.province || "", t.district, t.station, t.lead, t.leadEmail || "", t.phone, String(t.membersCount), (t.capabilities || [t.capability]).join("; "), t.availability, t.assignment || "None", String(t.readiness ?? "--")]),
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `aasha-rescue-roster-${now}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/dashboard" />} className="h-9 w-9 border-slate-200">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <p className="text-xs font-medium text-slate-400">Aasha Operations</p>
            <h1 className="text-lg font-bold text-slate-900">Rescue Team Roster</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTeams} className="gap-2 border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-red-600" : ""}`} /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExportBrief} className="gap-2 border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" /> Export Shift Brief
          </Button>
          <Button render={<Link href="/team-registration" />} className="gap-2 bg-red-600 font-medium text-white hover:bg-red-700 shadow-xs">
            <UserPlus className="h-4 w-4" /> Register Team
          </Button>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Field Readiness at a Glance</h2>
            <p className="mt-1 text-sm text-slate-500">Monitor availability, deployment load, and live coordinates across active sectors.</p>
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button onClick={() => setView("list")} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${view === "list" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}>
              <List className="h-4 w-4" /> List View
            </button>
            <button onClick={() => setView("map")} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${view === "map" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}>
              <MapIcon className="h-4 w-4" /> Full Map View
            </button>
          </div>
        </div>

        <TeamMetrics totalCount={teams.length} availableCount={availableCount} deployedCount={deployedCount} offDutyCount={offDutyCount} />
        <TeamFilterBar query={query} setQuery={setQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict} districts={districts} />

        {loading && (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
            <span className="ml-3 text-sm font-semibold text-slate-600">Loading approved rescue teams…</span>
          </div>
        )}

        {!loading && teams.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <Users className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">No Active Rescue Teams</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">Rescue teams appear here once they have been approved via Team Registration.</p>
            <Link href="/team-registration" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 shadow-sm">
              <UserPlus className="h-4 w-4" /> Register a Rescue Team
            </Link>
          </div>
        )}

        {!loading && teams.length > 0 && (
          <>
            {view === "list" ? (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
                <TeamTable teams={filteredTeams} selectedTeam={selectedTeam} onRowClick={handleRowClick} onOpenDetails={handleOpenDetails} onExportTeam={handleExportTeam} />
                <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Live Coverage Map</h3>
                      <p className="text-xs text-slate-500">{teams.length} teams positioned across Nepal</p>
                    </div>
                  </div>
                  <div className="h-full min-h-[400px] w-full overflow-hidden rounded-xl bg-slate-100 relative">
                    <RescueMap teams={teams} onSelectTeam={setSelectedTeam} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-[700px] w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
                <RescueMap teams={teams} onSelectTeam={setSelectedTeam} />
              </div>
            )}
          </>
        )}
      </main>
      <TeamDetailSheet open={isDetailOpen} onOpenChange={setIsDetailOpen} team={selectedTeam} onUpdateStatus={handleUpdateStatus} />
    </div>
  );
}