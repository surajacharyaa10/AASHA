"use client";

import { Shield } from "lucide-react";

import { DisasterEvent, Investigation, EVENT_TYPE_COLORS } from "@/lib/disaster-config";
import { getInvestigationStatusStyle, getEventDateString, getLocationString } from "@/lib/disaster-utils";

interface DisasterListProps {
  filteredDisasters: DisasterEvent[];
  loading: boolean;
  error: string | null;
  selectedDisaster: DisasterEvent | null;
  investigations: Investigation[];
  onSelectDisaster: (disaster: DisasterEvent) => void;
}

export function DisasterList({
  filteredDisasters,
  loading,
  error,
  selectedDisaster,
  investigations,
  onSelectDisaster,
}: DisasterListProps) {
  return (
    <div className="w-80 shrink-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">
          Disaster Events
        </h2>
        <p className="text-xs text-slate-500">
          {filteredDisasters.length} events in Nepal
        </p>
      </div>

      {loading ? (
        <div className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 text-xs text-red-600">{error}</div>
      ) : filteredDisasters.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400">
          <Shield className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
          No active disasters detected in Nepal
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {filteredDisasters.map((disaster) => {
            const timeStr = getEventDateString(disaster.date, disaster.created_time);
            const isSelected = selectedDisaster?.event_id === disaster.event_id;
            const colorClass = EVENT_TYPE_COLORS[disaster.event_type] || EVENT_TYPE_COLORS["Misc"];

            const activeInv = investigations.find(
              (inv) =>
                inv.disasterEventId === disaster.event_id &&
                (inv.status === "investigating" || inv.status === "pending")
            );

            return (
              <button
                key={disaster.event_id}
                onClick={() => onSelectDisaster(disaster)}
                className={`w-full p-4 text-left transition-colors hover:bg-slate-50 ${
                  isSelected
                    ? "bg-slate-50 ring-1 ring-inset ring-slate-300"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {disaster.event_name || disaster.event_type}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {getLocationString(
                        disaster.city,
                        disaster.state,
                        disaster.lat,
                        disaster.lng
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold ${colorClass}`}
                  >
                    {disaster.event_type}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <span className="font-medium">{timeStr}</span>
                  {disaster.alert_level && (
                    <span
                      className={`font-semibold capitalize ${
                        disaster.alert_level === "Red" ||
                        disaster.alert_level === "Orange"
                          ? "text-red-600"
                          : disaster.alert_level === "Yellow"
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {disaster.alert_level} alert
                    </span>
                  )}
                </div>

                {activeInv && (() => {
                  const invStyle = getInvestigationStatusStyle(activeInv);
                  return (
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${invStyle.listBadge}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 animate-pulse rounded-full ${invStyle.dot}`}
                        />
                        {invStyle.label}
                      </span>
                      {activeInv.assignedTeamName && (
                        <span className="text-[11px] font-medium text-slate-600">
                          · {activeInv.assignedTeamName}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
