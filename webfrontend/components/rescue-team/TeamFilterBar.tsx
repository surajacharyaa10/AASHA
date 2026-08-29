"use client";

import { Search } from "lucide-react";
import type { Availability } from "@/components/rescue-team/rescue-map";

interface TeamFilterBarProps {
  query: string;
  setQuery: (q: string) => void;
  statusFilter: "all" | Availability;
  setStatusFilter: (s: "all" | Availability) => void;
  selectedDistrict: string;
  setSelectedDistrict: (d: string) => void;
  districts: string[];
}

export function TeamFilterBar({
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  selectedDistrict,
  setSelectedDistrict,
  districts,
}: TeamFilterBarProps) {
  return (
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
              onClick={() => setStatusFilter(s as "all" | Availability)}
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
  );
}
