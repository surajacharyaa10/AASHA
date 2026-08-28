"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Download,
  Filter,
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
  Share2,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

type TimeRange = "24h" | "7d" | "30d" | "90d";

interface TrendDataPoint {
  label: string;
  total: number;
  resolved: number;
  altitude: number;
  trauma: number;
  weather: number;
}

const TREND_DATA: Record<TimeRange, TrendDataPoint[]> = {
  "24h": [
    { label: "00:00", total: 1, resolved: 1, altitude: 1, trauma: 0, weather: 0 },
    { label: "03:00", total: 0, resolved: 0, altitude: 0, trauma: 0, weather: 0 },
    { label: "06:00", total: 3, resolved: 3, altitude: 2, trauma: 1, weather: 0 },
    { label: "09:00", total: 6, resolved: 5, altitude: 3, trauma: 2, weather: 1 },
    { label: "12:00", total: 8, resolved: 7, altitude: 4, trauma: 3, weather: 1 },
    { label: "15:00", total: 11, resolved: 9, altitude: 6, trauma: 3, weather: 2 },
    { label: "18:00", total: 5, resolved: 4, altitude: 2, trauma: 2, weather: 1 },
    { label: "21:00", total: 2, resolved: 2, altitude: 1, trauma: 1, weather: 0 },
  ],
  "7d": [
    { label: "Mon", total: 14, resolved: 14, altitude: 6, trauma: 5, weather: 3 },
    { label: "Tue", total: 19, resolved: 18, altitude: 9, trauma: 6, weather: 4 },
    { label: "Wed", total: 12, resolved: 12, altitude: 5, trauma: 4, weather: 3 },
    { label: "Thu", total: 24, resolved: 23, altitude: 11, trauma: 8, weather: 5 },
    { label: "Fri", total: 29, resolved: 27, altitude: 14, trauma: 9, weather: 6 },
    { label: "Sat", total: 32, resolved: 30, altitude: 16, trauma: 10, weather: 6 },
    { label: "Sun", total: 18, resolved: 18, altitude: 8, trauma: 6, weather: 4 },
  ],
  "30d": [
    { label: "Week 1", total: 88, resolved: 86, altitude: 40, trauma: 28, weather: 20 },
    { label: "Week 2", total: 105, resolved: 102, altitude: 48, trauma: 34, weather: 23 },
    { label: "Week 3", total: 122, resolved: 119, altitude: 55, trauma: 41, weather: 26 },
    { label: "Week 4", total: 94, resolved: 92, altitude: 42, trauma: 31, weather: 21 },
  ],
  "90d": [
    { label: "Month 1", total: 340, resolved: 334, altitude: 150, trauma: 110, weather: 80 },
    { label: "Month 2", total: 420, resolved: 412, altitude: 190, trauma: 135, weather: 95 },
    { label: "Month 3", total: 385, resolved: 379, altitude: 175, trauma: 125, weather: 85 },
  ],
};

const CATEGORY_BREAKDOWN = [
  { name: "Altitude Illness (AMS/HAPE)", count: 54, percentage: 41, color: "bg-red-500", text: "text-red-600" },
  { name: "Avalanche & Crevasse", count: 36, percentage: 27, color: "bg-blue-500", text: "text-blue-600" },
  { name: "Trauma & Fractures", count: 26, percentage: 20, color: "bg-amber-500", text: "text-amber-600" },
  { name: "Lost / Severe Weather", count: 16, percentage: 12, color: "bg-slate-500", text: "text-slate-600" },
];

const SECTOR_METRICS = [
  { name: "Khumbu / Solukhumbu", incidents: 68, avgResponse: "5.2m", readiness: 96, risk: "High", riskColor: "bg-red-50 text-red-700 border-red-200" },
  { name: "Annapurna / Kaski", incidents: 42, avgResponse: "6.8m", readiness: 92, risk: "Moderate", riskColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Manang & Mustang", incidents: 24, avgResponse: "8.4m", readiness: 88, risk: "Moderate", riskColor: "bg-amber-50 text-amber-700 border-amber-200" },
  { name: "Langtang / Rasuwa", incidents: 14, avgResponse: "6.1m", readiness: 94, risk: "Low", riskColor: "bg-emerald-50 text-emerald-700 border-emerald-200" },
];

const TEAM_LEADERBOARD = [
  { name: "Team Echo", station: "Lukla", missions: 48, successRate: "100%", avgResponse: "4.8 min", score: 98 },
  { name: "Team Himal", station: "Namche", missions: 41, successRate: "97.5%", avgResponse: "5.4 min", score: 94 },
  { name: "Team Sagarmatha", station: "Phaplu", missions: 32, successRate: "100%", avgResponse: "6.1 min", score: 92 },
  { name: "Team Annapurna", station: "Pheriche", missions: 27, successRate: "96.3%", avgResponse: "5.9 min", score: 90 },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [hoveredPoint, setHoveredPoint] = useState<TrendDataPoint | null>(null);

  const currentTrends = TREND_DATA[timeRange];

  const totalIncidents = useMemo(() => {
    return currentTrends.reduce((acc, curr) => acc + curr.total, 0);
  }, [currentTrends]);

  const totalResolved = useMemo(() => {
    return currentTrends.reduce((acc, curr) => acc + curr.resolved, 0);
  }, [currentTrends]);

  const maxTrendValue = useMemo(() => {
    const max = Math.max(...currentTrends.map((d) => d.total));
    return max === 0 ? 10 : max;
  }, [currentTrends]);

  const handleExportAnalytics = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Timeframe,Total SOS,Resolved,Altitude Sickness,Trauma,Severe Weather"]
        .concat(
          currentTrends.map(
            (t) => `"${t.label}",${t.total},${t.resolved},${t.altitude},${t.trauma},${t.weather}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `aasha-analytics-${timeRange}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
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
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Operations & Rescue Analytics</h1>
              <Badge variant="success" className="text-[10px] font-bold uppercase tracking-wider">
                Live Telemetry
              </Badge>
            </div>
            <p className="text-xs font-medium text-slate-500">
              Real-time response times, extraction rates, and regional emergency dynamics
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 shadow-2xs">
            {(["24h", "7d", "30d", "90d"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold uppercase transition-all ${
                  timeRange === range
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleExportAnalytics}
            className="gap-2 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Telemetry
          </Button>
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* ── KPI Summary Cards ──────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Emergency Calls</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                  <AlertCircle className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{totalIncidents}</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+8.4% compared to prior window</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Dispatch & Response</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">5.8 min</p>
              <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>-1.2m faster response time</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Successful Extractions</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">
                {totalIncidents > 0 ? `${((totalResolved / totalIncidents) * 100).toFixed(1)}%` : "100%"}
              </p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                {totalResolved} of {totalIncidents} missions secured
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white p-5 shadow-xs">
            <CardContent className="p-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Fleet Active Readiness</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Shield className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">94.2%</p>
              <p className="mt-2 text-xs font-medium text-slate-500">
                Across 14 rapid-response stations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Graphs Section ───────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Incident Timeline Graph (2 cols) */}
          <Card className="lg:col-span-2 border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Incident Volume & Resolution Velocity</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Distribution of incoming SOS distress beacons vs resolved rescues
                </CardDescription>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-slate-900" />
                  <span className="text-slate-700">Total Calls</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-sm bg-emerald-500" />
                  <span className="text-slate-700">Resolved</span>
                </div>
              </div>
            </CardHeader>

            {/* Interactive SVG Bar Chart */}
            <div className="h-64 w-full relative flex items-end justify-between gap-3 pt-6 pb-6 px-2 border-b border-slate-100">
              {currentTrends.map((point) => {
                const totalHeight = (point.total / maxTrendValue) * 180;
                const resolvedHeight = (point.resolved / maxTrendValue) * 180;
                const isHovered = hoveredPoint?.label === point.label;

                return (
                  <div
                    key={point.label}
                    onMouseEnter={() => setHoveredPoint(point)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="relative flex flex-1 flex-col items-center h-full justify-end group cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-14 z-20 whitespace-nowrap rounded-xl border border-slate-200 bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg pointer-events-none">
                        <p className="font-bold">{point.label}</p>
                        <p className="text-[11px] text-slate-300">
                          {point.total} SOS · {point.resolved} Resolved
                        </p>
                      </div>
                    )}

                    {/* Bar pair */}
                    <div className="flex items-end gap-1 w-full max-w-[42px] justify-center">
                      <div
                        style={{ height: `${Math.max(totalHeight, 4)}px` }}
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered ? "bg-slate-700" : "bg-slate-900"
                        }`}
                      />
                      <div
                        style={{ height: `${Math.max(resolvedHeight, 4)}px` }}
                        className={`w-1/2 rounded-t-md transition-all duration-300 ${
                          isHovered ? "bg-emerald-400" : "bg-emerald-500"
                        }`}
                      />
                    </div>

                    {/* X-axis Label */}
                    <span className="mt-3 text-[11px] font-semibold text-slate-500 group-hover:text-slate-900">
                      {point.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bottom Quick Insight */}
            <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-red-500" />
                Peak emergency hours: <strong className="text-slate-800">14:00 - 17:00 NPT</strong> (Afternoon weather shifts)
              </span>
              <span>SLA Target: &lt; 10 min (Current: 98.2% in compliance)</span>
            </div>
          </Card>

          {/* Incident Nature & Breakdown (1 col) */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
            <div>
              <CardHeader className="p-0 mb-5">
                <CardTitle className="text-base font-bold text-slate-900">Incident Category Breakdown</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Primary classification of reported emergency calls
                </CardDescription>
              </CardHeader>

              {/* Progress Distribution Bars */}
              <div className="space-y-4">
                {CATEGORY_BREAKDOWN.map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{cat.name}</span>
                      <span className={cat.text}>{cat.percentage}% ({cat.count})</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        style={{ width: `${cat.percentage}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${cat.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-red-100 bg-red-50/60 p-3.5 text-xs text-red-800">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Activity className="h-4 w-4 text-red-600" />
                High Altitude Advisory
              </div>
              <p className="text-red-700">
                AMS & HAPE cases account for over 40% of helicopter extractions above 4,000m.
              </p>
            </div>
          </Card>
        </div>

        {/* ── Regional Telemetry & Team Performance ─────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Sector Risk & Deployment */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Regional Sector Telemetry</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Incident density and average response latency by district
                </CardDescription>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5">Sector Area</th>
                    <th className="py-2.5">Incidents</th>
                    <th className="py-2.5">Avg Response</th>
                    <th className="py-2.5">Readiness</th>
                    <th className="py-2.5 text-right">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SECTOR_METRICS.map((sec) => (
                    <tr key={sec.name} className="hover:bg-slate-50">
                      <td className="py-3 font-bold text-slate-900 flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {sec.name}
                      </td>
                      <td className="py-3 font-semibold text-slate-700">{sec.incidents} calls</td>
                      <td className="py-3 font-medium text-slate-600">{sec.avgResponse}</td>
                      <td className="py-3 font-semibold text-slate-900">{sec.readiness}%</td>
                      <td className="py-3 text-right">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${sec.riskColor}`}>
                          {sec.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Unit Efficiency & Missions Leaderboard */}
          <Card className="border-slate-200 bg-white p-6 shadow-xs">
            <CardHeader className="p-0 mb-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">Rescue Unit Performance</CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-1">
                  Missions completed and SLA compliance scores
                </CardDescription>
              </div>
            </CardHeader>

            <div className="space-y-3">
              {TEAM_LEADERBOARD.map((team, index) => (
                <div
                  key={team.name}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{team.name}</p>
                      <p className="text-[11px] text-slate-500">Base: {team.station} · {team.missions} Missions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-xs font-bold text-emerald-600">{team.successRate}</p>
                      <p className="text-[10px] text-slate-400">Success</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{team.avgResponse}</p>
                      <p className="text-[10px] text-slate-400">Avg Time</p>
                    </div>
                    <div className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-bold text-white">
                      {team.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

