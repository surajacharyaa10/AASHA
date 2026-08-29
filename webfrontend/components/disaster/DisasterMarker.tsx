"use client";

import { Flame, Waves, CloudRain, Mountain, Sun, CloudSnow, Wind, AlertTriangle } from "lucide-react";

interface DisasterMarkerProps {
  eventType: string;
  severity?: string;
  onClick?: () => void;
}

const EVENT_TYPE_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  WF: { color: "bg-red-600", icon: <Flame className="h-4 w-4 text-white" />, label: "Wildfire" },
  TN: { color: "bg-blue-600", icon: <Waves className="h-4 w-4 text-white" />, label: "Tsunami" },
  EQ: { color: "bg-amber-600", icon: <Mountain className="h-4 w-4 text-white" />, label: "Earthquake" },
  TC: { color: "bg-cyan-600", icon: <Wind className="h-4 w-4 text-white" />, label: "Cyclone" },
  FL: { color: "bg-blue-700", icon: <CloudRain className="h-4 w-4 text-white" />, label: "Flood" },
  ET: { color: "bg-orange-600", icon: <Sun className="h-4 w-4 text-white" />, label: "Extreme Temp" },
  DR: { color: "bg-yellow-700", icon: <Sun className="h-4 w-4 text-white" />, label: "Drought" },
  SW: { color: "bg-slate-700", icon: <CloudRain className="h-4 w-4 text-white" />, label: "Severe Storm" },
  SI: { color: "bg-sky-400", icon: <CloudSnow className="h-4 w-4 text-white" />, label: "Sea Ice" },
  VO: { color: "bg-red-800", icon: <Mountain className="h-4 w-4 text-white" />, label: "Volcano" },
  LS: { color: "bg-stone-600", icon: <Mountain className="h-4 w-4 text-white" />, label: "Landslide" },
  Misc: { color: "bg-gray-600", icon: <AlertTriangle className="h-4 w-4 text-white" />, label: "Misc" },
};

export function DisasterMarker({ eventType, severity, onClick }: DisasterMarkerProps) {
  const config = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG["Misc"];
  
  const severityScale = severity === "High Risk" ? "scale-125" : severity === "Moderate Risk" ? "scale-110" : "";

  return (
    <div
      onClick={onClick}
      className={`cursor-pointer transition-transform hover:scale-110 flex h-8 w-8 items-center justify-center rounded-full ${config.color} shadow-lg ${severityScale}`}
      title={`${config.label}${severity ? ` · ${severity}` : ""}`}
    >
      {config.icon}
    </div>
  );
}
