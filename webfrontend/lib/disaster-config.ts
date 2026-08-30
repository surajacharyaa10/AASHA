

import BACKEND_URL_CONFIG from "@/lib/config";



export const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };

export const BACKEND = BACKEND_URL_CONFIG;

export type TimeRange = 7 | 15 | 30 | null;

export const TIME_RANGES: {
  value: TimeRange;
  label: string;
  description: string;
}[] = [
  { value: 7, label: "7D", description: "Last 7 days" },
  { value: 15, label: "15D", description: "Last 15 days" },
  { value: 30, label: "30D", description: "Last 30 days" },
  { value: null, label: "ALL", description: "All available events" },
];

export const EVENT_TYPES = [
  "All",
  "EQ",
  "FL",
  "WF",
  "SW",
  "VO",
  "DR",
  "TC",
  "LS",
  "ET",
  "TN",
];

export const EVENT_TYPE_COLORS: Record<string, string> = {
  WF: "bg-red-100 text-red-700 border-red-200",
  TN: "bg-blue-100 text-blue-700 border-blue-200",
  EQ: "bg-amber-100 text-amber-700 border-amber-200",
  TC: "bg-cyan-100 text-cyan-700 border-cyan-200",
  FL: "bg-sky-100 text-sky-700 border-sky-200",
  ET: "bg-orange-100 text-orange-700 border-orange-200",
  DR: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SW: "bg-slate-100 text-slate-700 border-slate-200",
  SI: "bg-sky-100 text-sky-700 border-sky-200",
  VO: "bg-red-100 text-red-800 border-red-200",
  LS: "bg-stone-100 text-stone-700 border-stone-200",
  Misc: "bg-gray-100 text-gray-700 border-gray-200",
};

export interface GeometryResponse {
  message?: string;
  result?: Array<{
    geometry?: {
      coordinates?: number[][][];
    };
  }>;
}

export interface DisasterEvent {
  event_id: string;
  event_type: string;
  event_name: string;
  city: string;
  state: string;
  country_code: string;
  lat: number;
  lng: number;
  date: string;
  alert_level: string;
  proximity_severity_level: string;
  details: Record<string, unknown>;
  end_date: string;
  created_time: string;
  source_event_id: string;
}

export interface Investigation {
  id: string;
  disasterEventId: string;
  disasterName: string;
  location: string;
  status: string;
  assessment?: string;
  assignedTeamName?: string;
  lat: number;
  lng: number;
}

export interface NearestTeam {
  teamName: string;
  district: string;
  province: string;
  distanceKm: number;
  etaMinutes: number;
  leadName: string;
  leadPhone: string;
}

export const DISASTER_API = {
  latestByCountry: (countryCode: string, limit = 200, page = 1, days?: number, eventType?: string) =>
    `${BACKEND}/api/disasters/latest/by-country-code?countryCode=${countryCode}&limit=${limit}&page=${page}${days ? `&days=${days}` : ""}${eventType ? `&eventType=${encodeURIComponent(eventType)}` : ""}`,
  geometry: (sourceEventId: string) =>
    `${BACKEND}/api/disasters/geometry/by-source-eventId?sourceEventId=${sourceEventId}`,
  investigations: `${BACKEND}/api/investigations`,
  nearestTeam: (lat: number, lng: number) =>
    `${BACKEND}/api/investigations/nearest-team?lat=${lat}&lng=${lng}`,
  createInvestigation: `${BACKEND}/api/investigations`,
  assignInvestigation: (id: string) =>
    `${BACKEND}/api/investigations/${id}/assign`,
};
