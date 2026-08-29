"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertCircle,
  CheckCircle2,
  Users,
  Shield,
  Activity,
  MapPin,
  Flame,
  Radio,
  RefreshCw,
} from "lucide-react";
import { io } from "socket.io-client";

import { Button } from "@/components/ui/button";
import BACKEND_URL from "@/lib/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const BACKEND = BACKEND_URL;


type TimeRange = "24h" | "7d";

interface TrendPoint { label: string; total: number; resolved: number; }

interface AnalyticsSummary {
  totalSos: number;
  pendingSos: number;
  assignedSos: number;
  resolvedSos: number;
  totalTeams: number;
  approvedTeams: number;
  availableTeams: number;
  deployedTeams: number;
  successRate: string;
}

interface TeamRow {
  id: string;
  teamName: string;
  station: string;
  district: string;
  province: string;
  availability: string;
  assignment: string | null;
  leadName: string;
  memberCount: number;
}

interface RecentEvent {
  id: string;
  status: string;
  lat?: number;
  lng?: number;
  battery?: number;
  hops?: number;
  reportedAt: string;
  assignedTeamName?: string;
}

interface AnalyticsData {
  summary: AnalyticsSummary;
  hourly24h: TrendPoint[];
  weekly7d: TrendPoint[];
  recentEvents: RecentEvent[];
  teams: TeamRow[];
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND}/api/analytics/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => { fetchData(); }, [fetchData]);

  // Socket.io live refresh on any SOS change
  useEffect(() => {
    const socket = io(BACKEND);
    socket.on("sos:new", () => fetchData());
    socket.on("sos:updated", () => fetchData());
    return () => { socket.disconnect(); };
  }, [fetchData]);

  const currentTrends = data
    ? timeRange === "24h" ? data.hourly24h : data.weekly7d
    : [];
  const maxTrendValue = Math.max(...currentTrends.map((d) => d.total), 1);

  const handleExport = () => {
    if (!data) return;
    const rows = currentTrends.map((t) => `"${t.label}",${t.total},${t.resolved}`);
    const csv = `data:text/csv;charset=utf-8,Timeframe,Total SOS,Resolved\n${rows.join("\n")}`;
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `aasha-analytics-${timeRange}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const s = data?.summary;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Header ─── */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/dashboard" />} className="h-9 w-9 border-slate-200">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Operations & Rescue Analytics</h1>
              <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider">
                Live
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {lastUpdated
                ? `Last updated ${lastUpdated.toLocaleTimeString()}`
                : "Loading real-time data…"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
            {(["24h", "7d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                  timeRange === range ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="outline" onClick={fetchData} className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport} className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total SOS Events</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-bold text-slate-900">{s?.totalSos ?? 0}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
                <span className="text-amber-600">⏳ {s?.pendingSos ?? 0} Pending</span>
                <span className="text-blue-600">🔵 {s?.assignedSos ?? 0} Active</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Resolved Missions</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-bold text-slate-900">{s?.resolvedSos ?? 0}</p>
              )}
              <p className="mt-2 text-xs font-medium text-slate-500">
                {s?.successRate ?? "0"}% success rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Rescue Teams</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-bold text-slate-900">{s?.approvedTeams ?? 0}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold">
                <span className="text-emerald-600">✅ {s?.availableTeams ?? 0} Available</span>
                <span className="text-blue-600">🚁 {s?.deployedTeams ?? 0} Deployed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fleet Readiness</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              {loading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
              ) : (
                <p className="mt-3 text-3xl font-bold text-slate-900">
                  {s && s.approvedTeams > 0
                    ? `${Math.round((s.availableTeams / s.approvedTeams) * 100)}%`
                    : "—"}
                </p>
              )}
              <p className="mt-2 text-xs font-medium text-slate-500">
                {s?.approvedTeams ?? 0} approved teams registered
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Incident Timeline */}
          <Card className="lg:col-span-2 border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Incident Volume & Resolution
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Real SOS beacons received vs resolved — {timeRange === "24h" ? "last 24 hours" : "last 7 days"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-slate-900" />
                  <span className="text-slate-700">Total</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-slate-700">Resolved</span>
                </div>
              </div>
            </CardHeader>

            <div className="h-64 w-full relative flex items-end justify-between gap-3 pt-6 pb-6 px-2 border-b border-slate-100">
              {loading ? (
                <div className="w-full flex items-end justify-between gap-3 h-full">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center h-full justify-end gap-1">
                      <div className="w-full max-w-[42px] rounded-t-md bg-slate-100 animate-pulse" style={{ height: `${30 + i * 20}px` }} />
                    </div>
                  ))}
                </div>
              ) : (
                currentTrends.map((point) => {
                  const totalH = (point.total / maxTrendValue) * 180;
                  const resolvedH = (point.resolved / maxTrendValue) * 180;
                  const isHov = hoveredPoint?.label === point.label;
                  return (
                    <div
                      key={point.label}
                      onMouseEnter={() => setHoveredPoint(point)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                    >
                      {isHov && (
                        <div className="absolute -top-14 z-20 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg pointer-events-none">
                          <p className="font-bold">{point.label}</p>
                          <p className="text-[11px] text-slate-300">{point.total} SOS · {point.resolved} Resolved</p>
                        </div>
                      )}
                      <div className="flex items-end gap-1 w-full max-w-[42px] justify-center">
                        <div style={{ height: `${Math.max(totalH, 4)}px` }} className={`w-1/2 rounded-t-md transition-all duration-300 ${isHov ? "bg-slate-700" : "bg-slate-900"}`} />
                        <div style={{ height: `${Math.max(resolvedH, 4)}px` }} className={`w-1/2 rounded-t-md transition-all duration-300 ${isHov ? "bg-emerald-400" : "bg-emerald-500"}`} />
                      </div>
                      <span className="mt-3 text-[11px] font-semibold text-slate-500 group-hover:text-slate-900">{point.label}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-red-500" />
                Total {s?.totalSos ?? 0} SOS events · {s?.resolvedSos ?? 0} resolved · {s?.pendingSos ?? 0} pending
              </span>
              <span>Success rate: <strong className="text-slate-800">{s?.successRate ?? "0"}%</strong></span>
            </div>
          </Card>

          {/* Status Breakdown */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 mb-5">
                <CardTitle className="text-base font-bold text-slate-900">SOS Status Breakdown</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">Live distribution of all events</CardDescription>
              </CardHeader>

              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
                      <div className="h-2 w-full animate-pulse rounded-full bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {[
                    { name: "Pending Review", count: s?.pendingSos ?? 0, color: "bg-red-500", text: "text-red-600" },
                    { name: "Team Dispatched", count: s?.assignedSos ?? 0, color: "bg-blue-500", text: "text-blue-600" },
                    { name: "Mission Resolved", count: s?.resolvedSos ?? 0, color: "bg-emerald-500", text: "text-emerald-600" },
                  ].map((cat) => {
                    const total = s?.totalSos ?? 1;
                    const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                    return (
                      <div key={cat.name} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700">{cat.name}</span>
                          <span className={cat.text}>{pct}% ({cat.count})</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div style={{ width: `${pct}%` }} className={`h-full rounded-full transition-all duration-500 ${cat.color}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-blue-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Activity className="h-4 w-4 text-blue-600" />
                Team Fleet Status
              </div>
              <p className="text-blue-700">
                {s?.availableTeams ?? 0} of {s?.approvedTeams ?? 0} approved teams are currently available for dispatch.
                {(s?.deployedTeams ?? 0) > 0 && ` ${s?.deployedTeams} team(s) on active mission.`}
              </p>
            </div>
          </Card>
        </div>

        {/* ── Tables ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Events */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-bold text-slate-900">Recent SOS Events</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">Latest 10 distress beacons received</CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5">ID</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5">Team</th>
                    <th className="py-2.5 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={4} className="py-3"><div className="h-3 animate-pulse rounded bg-slate-100" /></td>
                      </tr>
                    ))
                  ) : data?.recentEvents?.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-400">No SOS events yet</td></tr>
                  ) : (
                    data?.recentEvents?.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50">
                        <td className="py-3 font-mono font-bold text-slate-800">{ev.id.slice(0, 8)}…</td>
                        <td className="py-3">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                            ev.status === "pending" ? "bg-red-50 text-red-700 border-red-200"
                            : ev.status === "assigned" ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3 text-slate-600">{ev.assignedTeamName || "—"}</td>
                        <td className="py-3 text-right text-slate-500">
                          {new Date(ev.reportedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Team Roster */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="text-base font-bold text-slate-900">Rescue Team Roster</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">Approved teams and current status</CardDescription>
            </CardHeader>
            <div className="space-y-2.5">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))
              ) : data?.teams?.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No approved teams yet</p>
              ) : (
                data?.teams?.map((team) => (
                  <div key={team.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white ${
                        team.availability === "deployed" ? "bg-blue-600" : team.availability === "off-duty" ? "bg-slate-400" : "bg-emerald-600"
                      }`}>
                        {team.teamName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{team.teamName}</p>
                        <p className="text-[11px] text-slate-500">{team.station}, {team.district} · {team.memberCount} members</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border capitalize ${
                        team.availability === "available" ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : team.availability === "deployed" ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                        {team.availability || "available"}
                      </span>
                      {team.assignment && (
                        <p className="text-[10px] text-blue-600 font-semibold mt-0.5">{team.assignment}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
