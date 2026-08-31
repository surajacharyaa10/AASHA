

import BACKEND_URL_CONFIG from "@/lib/config";



export const NEPAL_CENTER = { lat: 28.3949, lng: 84.1240 };

export const BACKEND = BACKEND_URL_CONFIG;

export type TimeRange = 0 | 7 | 15 | 30 | null;

export const TIME_RANGES: {
  value: TimeRange;
  label: string;
  description: string;
}[] = [
  { value: 0, label: "Current", description: "Currently active events" },
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

export interface DynamicFeedHazard {
  category: string;
  headline: string;
  severity: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  time: string;
  source: string;
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

export function dynamicFeedHazardToDisasterEvent(hazard: DynamicFeedHazard, index: number): DisasterEvent {
  const severityMap: Record<string, string> = {
    Red: "Red",
    Orange: "Orange",
    Yellow: "Yellow",
    Green: "Green",
  };

  const eventTypeMap: Record<string, string> = {
    Flood: "FL",
    Earthquake: "EQ",
    Wildfire: "WF",
    Cyclone: "TC",
    "Severe Storm": "SW",
    Volcano: "VO",
    Drought: "DR",
    Tsunami: "TN",
    Landslide: "LS",
    "Extreme Temp": "ET",
  };

  void eventTypeMap;

  const source = hazard.source || "Unknown";
  const sourceLower = source.toLowerCase();
  let eventType = "Misc";

  if (hazard.category === "disaster") {
    if (sourceLower.includes("gdacs")) eventType = "FL";
    else if (sourceLower.includes("eonet")) eventType = "WF";
    else if (sourceLower.includes("usgs")) eventType = "EQ";
    else if (sourceLower.includes("ga")) eventType = "WF";
  }

  const stableId = `${source}-${hazard.latitude}-${hazard.longitude}-${hazard.time}-${hazard.headline}`;
  const sourceEventId = `DF-${stableId}`;

  return {
    event_id: sourceEventId,
    event_type: eventType,
    event_name: hazard.headline || `Hazard ${index + 1}`,
    city: "",
    state: "",
    country_code: "NPL",
    lat: hazard.latitude,
    lng: hazard.longitude,
    date: hazard.time,
    alert_level: severityMap[hazard.severity] || hazard.severity,
    proximity_severity_level: hazard.severity === "Red" ? "High Risk" : hazard.severity === "Orange" ? "Moderate Risk" : "Low Risk",
    details: {
      distance_km: hazard.distance_km,
      source: hazard.source,
      category: hazard.category,
    },
    end_date: hazard.time,
    created_time: hazard.time,
    source_event_id: sourceEventId,
    isDynamicFeed: true,
  };
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
  isDynamicFeed?: boolean;
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

export const DYNAMICFEED_API_URL = "https://dynamicfeed.ai/v1/nearby";
