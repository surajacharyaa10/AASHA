"use client";

import { ChevronRight } from "lucide-react";
import type { SosEvent, SosStatus } from "@/app/components/SOSDetails";
import { STATUS_STYLES } from "./types";

function StatusPill({ status }: { status: SosStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.badgeBg} ${s.badgeText}`}>
      {status[0].toUpperCase() + status.slice(1)}
    </span>
  );
}

interface EventCardProps {
  event: SosEvent;
  active?: boolean;
  onClick?: () => void;
}

export function EventCard({ event, active, onClick }: EventCardProps) {
  const s = STATUS_STYLES[event.status];
  return (
    <button
      onClick={onClick}
      className={`group w-full rounded-xl border bg-white p-4 text-left shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50/60 ${
        active ? s.ring : "border-slate-200"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
            {event.id}
          </span>
        </div>
        <StatusPill status={event.status} />
      </div>
      <p className="text-sm font-medium text-slate-700">{event.place}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>{event.meta}</span>
        <span className="flex items-center text-[11px] font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
          View details <ChevronRight className="h-3 w-3 ml-0.5" />
        </span>
      </div>
    </button>
  );
}
