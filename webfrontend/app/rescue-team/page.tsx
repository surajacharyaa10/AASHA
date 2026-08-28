"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Plus,
  List,
  Map as MapIcon,
  CheckCircle2,
  Users,
  Clock,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Maximize2,
  Phone,
  Shield,
  MapPin,
  Filter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  RescueMap,
  RescueTeam,
  Availability,
} from "@/components/rescue-team/rescue-map";
import { AddTeamSheet } from "@/components/rescue-team/add-team-sheet";
import { TeamDetailSheet } from "@/components/rescue-team/team-detail-sheet";

const INITIAL_TEAMS: RescueTeam[] = [
  {
    id: "echo",
    name: "Team Echo",
    initial: "E",
    capability: "Rope rescue · Trauma care",
    station: "Lukla",
    district: "Solukhumbu",
    lead: "Pemba Sherpa",
    phone: "+977 9841234567",
    membersCount: 6,
    availability: "available",
    assignment: null,
    readiness: 100,
    lat: 27.6869,
    lng: 86.7314,
  },
  {
    id: "himal",
    name: "Team Himal",
    initial: "H",
    capability: "High altitude · Medical",
    station: "Namche Bazaar",
    district: "Solukhumbu",
    lead: "Ang Tshering",
    phone: "+977 9851098765",
    membersCount: 8,
    availability: "deployed",
    assignment: "SOS-NEP-0840",
    readiness: 82,
    lat: 27.8069,
    lng: 86.7139,
  },
  {
    id: "sagarmatha",
    name: "Team Sagarmatha",
    initial: "S",
    capability: "Evacuation · Search",
    station: "Phaplu",
    district: "Solukhumbu",
    lead: "Dawa Norbu",
    phone: "+977 9801239876",
    membersCount: 6,
    availability: "available",
    assignment: null,
    readiness: 94,
    lat: 27.5186,
    lng: 86.5878,
  },
  {
    id: "kosi",
    name: "Team Kosi",
    initial: "K",
    capability: "Swift water · Logistics",
    station: "Salleri",
    district: "Solukhumbu",
    lead: "Karma Sherpa",
    phone: "+977 9812345678",
    membersCount: 5,
    availability: "off-duty",
    assignment: "Shift handover",
    readiness: null,
    lat: 27.502,
    lng: 86.591,
  },
  {
    id: "annapurna",
    name: "Team Annapurna",
    initial: "A",
    capability: "Avalanche search · Heli-evac",
    station: "Pheriche",
    district: "Solukhumbu",
    lead: "Lhakpa Rita",
    phone: "+977 9860123456",
    membersCount: 7,
    availability: "deployed",
    assignment: "SOS-NEP-0842",
    readiness: 90,
    lat: 27.8942,
    lng: 86.8219,
  },
];

export default function RescueTeamRoster() {
  const [teams, setTeams] = useState<RescueTeam[]>(INITIAL_TEAMS);
  const [view, setView] = useState<"list" | "map">("list");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Availability>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

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

      const matchesStatus =
        statusFilter === "all" || t.availability === statusFilter;

      const matchesDistrict =
        selectedDistrict === "all" || t.district === selectedDistrict;

      return matchesQuery && matchesStatus && matchesDistrict;
    });
  }, [teams, query, statusFilter, selectedDistrict]);

  const handleAddTeam = (newTeam: RescueTeam) => {
    setTeams((prev) => [newTeam, ...prev]);
    setSelectedTeam(newTeam);
  };

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
      setSelectedTeam((prev) =>
        prev
          ? {
              ...prev,
              availability: status,
              assignment: status === "deployed" ? "SOS-NEP-ASSIGNED" : null,
              readiness: status === "off-duty" ? null : prev.readiness ?? 90,
            }
          : null
      );
    }
  };

  const handleRowClick = (team: RescueTeam) => {
    setSelectedTeam(team);
  };

  const handleOpenDetails = (team: RescueTeam, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTeam(team);
    setIsDetailOpen(true);
  };

  const handleExportBrief = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["ID,Name,Station,District,Status,Readiness,Lead,Phone,Assignment"]
        .concat(
          teams.map(
            (t) =>
              `"${t.id}","${t.name}","${t.station}","${t.district}","${t.availability}","${t.readiness ?? "--"}","${t.lead}","${t.phone}","${t.assignment ?? "None"}"`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aasha-rescue-roster-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            render={<Link href="/dashboard" />}
            className="h-9 w-9 border-slate-200"
          >
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <p className="text-xs font-medium text-slate-400">Aasha Operations</p>
            <h1 className="text-lg font-bold text-slate-900">Rescue Team Roster</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExportBrief}
            className="gap-2 border-slate-200 font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Shift Brief
          </Button>
          <Button
            onClick={() => setIsAddTeamOpen(true)}
            className="gap-2 bg-red-600 font-medium text-white hover:bg-red-700 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Add Team
          </Button>
        </div>
      </header>

      <main className="px-6 py-6">
        {/* ── Title row & View Toggles ──────────────────────── */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Field Readiness at a Glance</h2>
            <p className="mt-1 text-sm text-slate-500">
              Monitor availability, deployment load, and live coordinates across active sectors.
            </p>
          </div>

          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                view === "list"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <List className="h-4 w-4" />
              List View
            </button>
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                view === "map"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <MapIcon className="h-4 w-4" />
              Full Map View
            </button>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────── */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Available Now</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {String(availableCount).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-600">
                Ready for immediate dispatch
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Currently Deployed</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {String(deployedCount).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Active in field operations
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Off Duty / Rest</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {String(offDutyCount).padStart(2, "0")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Next shift rotation at 17:00 NPT
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Search & Filter Controls ──────────────────────── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xs">
          <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, station, capability, or lead..."
              className="w-full bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["all", "available", "deployed", "off-duty"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize transition-all ${
                    statusFilter === s
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="h-8 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
            >
              <option value="all">All Districts</option>
              {districts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Main Content: List View vs Full Map View ──────── */}
        {view === "list" ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            {/* Table Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="px-5 py-3.5">Rescue Team</th>
                      <th className="px-4 py-3.5">Base Station</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5">Assignment</th>
                      <th className="px-4 py-3.5">Readiness</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTeams.map((team) => {
                      const isSelected = selectedTeam?.id === team.id;
                      return (
                        <tr
                          key={team.id}
                          onClick={() => handleRowClick(team)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-slate-50/90 font-medium"
                              : "hover:bg-slate-50/60"
                          }`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-xs">
                                {team.initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">{team.name}</p>
                                <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                  {team.capability}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>{team.station}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 pl-5">
                              {team.district}
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <Badge
                              variant={
                                team.availability === "available"
                                  ? "success"
                                  : team.availability === "deployed"
                                  ? "info"
                                  : "secondary"
                              }
                              className="capitalize font-semibold"
                            >
                              {team.availability}
                            </Badge>
                          </td>

                          <td className="px-4 py-4">
                            {team.assignment ? (
                              <span className="font-semibold text-blue-600">
                                {team.assignment}
                              </span>
                            ) : (
                              <span className="text-slate-400">Unassigned</span>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            {team.readiness !== null ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                    team.readiness >= 90
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : team.readiness >= 70
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-red-50 text-red-700 border border-red-200"
                                  }`}
                                >
                                  {team.readiness}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">--</span>
                            )}
                          </td>

                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleOpenDetails(team, e)}
                              className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredTeams.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                          No rescue teams match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Coverage Map Card */}
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Live Coverage Map</h3>
                  <p className="text-xs text-slate-500">
                    {teams.length} teams positioned in Sector 1
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setView("map")}
                  title="Expand to Full Map"
                  className="h-8 w-8 text-slate-600"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Working Interactive Map Component */}
              <div className="h-80 w-full overflow-hidden rounded-xl">
                <RescueMap
                  teams={filteredTeams}
                  selectedTeam={selectedTeam}
                  onSelectTeam={setSelectedTeam}
                  onToggleExpand={() => setView("map")}
                  showControls={false}
                  className="h-full w-full"
                />
              </div>

              {/* Selected Team Quick Overview */}
              {selectedTeam && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">{selectedTeam.name}</span>
                    <Badge
                      variant={
                        selectedTeam.availability === "available"
                          ? "success"
                          : selectedTeam.availability === "deployed"
                          ? "info"
                          : "secondary"
                      }
                      className="text-[10px]"
                    >
                      {selectedTeam.availability}
                    </Badge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    Base: {selectedTeam.station} · Lead: {selectedTeam.lead}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDetailOpen(true)}
                      className="h-7 flex-1 text-[11px]"
                    >
                      View Team Dossier
                    </Button>
                    <a
                      href={`tel:${selectedTeam.phone}`}
                      className="inline-flex h-7 items-center justify-center rounded-lg bg-slate-900 px-3 text-[11px] font-semibold text-white hover:bg-slate-800"
                    >
                      <Phone className="h-3 w-3 mr-1" /> Call
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Full Map View */
          <div className="relative h-[calc(100vh-280px)] min-h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xs">
            <RescueMap
              teams={filteredTeams}
              selectedTeam={selectedTeam}
              onSelectTeam={setSelectedTeam}
              isExpanded={true}
              onToggleExpand={() => setView("list")}
              className="h-full w-full"
            />
          </div>
        )}
      </main>

      {/* Slide-over Sheets */}
      <AddTeamSheet
        open={isAddTeamOpen}
        onOpenChange={setIsAddTeamOpen}
        onAddTeam={handleAddTeam}
      />

      <TeamDetailSheet
        team={selectedTeam}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
}