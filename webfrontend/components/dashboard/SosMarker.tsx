"use client";

import { AlertCircle, UserCheck, CheckCircle2 } from "lucide-react";
import type { SosStatus } from "@/app/components/SOSDetails";

interface SosMarkerProps {
  status: SosStatus;
  onClick?: () => void;
}

export function SosMarker({ status, onClick }: SosMarkerProps) {
  if (status === "resolved") {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"
      >
        <CheckCircle2 className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "assigned") {
    return (
      <div
        onClick={onClick}
        className="cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 shadow-lg shadow-amber-400/30"
      >
        <UserCheck className="h-5 w-5 text-slate-900" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div
      onClick={onClick}
      className="group relative cursor-pointer transition-transform hover:scale-110 flex h-9 w-9 items-center justify-center"
    >
      <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-red-500/20" />
      <span className="absolute inline-flex h-11 w-11 rounded-full bg-red-500/25" />
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-red-600 shadow-lg shadow-red-600/40">
        <AlertCircle className="h-5 w-5 text-white" strokeWidth={2.5} />
      </span>
    </div>
  );
}
