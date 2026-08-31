"use client";

import { AlertTriangle, Globe, Shield } from "lucide-react";

import { DisasterEvent, EVENT_TYPE_COLORS } from "@/lib/disaster-config";

interface DisasterStatsProps {
  stats: {
    total: number;
    byType: Record<string, number>;
  };
  filteredDisasters: DisasterEvent[];
  liveCount?: number;
}

export function DisasterStats({ stats, filteredDisasters, liveCount = 0 }: DisasterStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-4">
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            Active Disasters
          </p>
          <span className="text-2xl font-bold text-slate-900">
            {stats.total}
          </span>
          <p className="text-xs text-slate-500">
            in Nepal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
          <Globe className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            Nearby Events
          </p>
          <span className="text-2xl font-bold text-slate-900">
            {filteredDisasters.length}
          </span>
          <p className="text-xs text-slate-500">
            regional
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
          <Shield className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            Live Hazards
          </p>
          <span className="text-2xl font-bold text-slate-900">
            {liveCount}
          </span>
          <p className="text-xs text-slate-500">
            within 500 km
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:col-span-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
          <Shield className="h-5 w-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            Event Types Active
          </p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {Object.entries(stats.byType).map(([type, count]) => (
              <span
                key={type}
                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                  EVENT_TYPE_COLORS[type] ||
                  "border-gray-200 bg-gray-100 text-gray-700"
                }`}
              >
                {type}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
