"use client";

import { Filter } from "lucide-react";
import type { SosEvent, SosStatus } from "@/app/components/SOSDetails";
import { EventCard } from "./EventCard";

interface SosEventQueueProps {
  events: SosEvent[];
  tab: SosStatus;
  counts: Record<SosStatus, number>;
  onTabChange: (tab: SosStatus) => void;
  onSelectEvent: (event: SosEvent) => void;
}

export function SosEventQueue({
  events,
  tab,
  counts,
  onTabChange,
  onSelectEvent,
}: SosEventQueueProps) {
  const filtered = events.filter((e) => e.status === tab);

  return (
    <aside className="flex w-[340px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">SOS Event Queue</h2>
          <p className="text-xs text-slate-500">{events.length} requiring coordination</p>
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
          <Filter className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        {(["pending", "assigned", "resolved"] as SosStatus[]).map((s) => {
          const isActive = tab === s;
          return (
            <button
              key={s}
              onClick={() => onTabChange(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? s === "pending"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s[0].toUpperCase() + s.slice(1)} {counts[s]}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {filtered.map((event) => (
          <EventCard key={event.id} event={event} onClick={() => onSelectEvent(event)} />
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No {tab} events.</p>
        )}
      </div>
    </aside>
  );
}
