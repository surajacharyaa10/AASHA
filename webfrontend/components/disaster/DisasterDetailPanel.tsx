"use client";

import { Search, UserPlus, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DisasterEvent, Investigation, NearestTeam, EVENT_TYPE_COLORS } from "@/lib/disaster-config";
import { getInvestigationDisplayStatus } from "@/lib/disaster-utils";

interface DisasterDetailPanelProps {
  selectedDisaster: DisasterEvent;
  polygon: [number, number][] | null;
  loadingPolygon: boolean;
  investigationId: string | null;
  currentInvestigationStatus: string;
  currentAssessment: string | undefined;
  isInvestigationComplete: boolean;
  nearestTeam: NearestTeam | null;
  investigating: boolean;
  onClose: () => void;
  onInvestigate: () => void;
  onAssignInvestigation: () => void;
}

export function DisasterDetailPanel({
  selectedDisaster,
  polygon,
  loadingPolygon,
  investigationId,
  currentInvestigationStatus,
  currentAssessment,
  isInvestigationComplete,
  nearestTeam,
  investigating,
  onClose,
  onInvestigate,
  onAssignInvestigation,
}: DisasterDetailPanelProps) {
  return (
    <div className="absolute right-4 top-16 w-80 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">
          Event Details
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            Event Name
          </p>
          <p className="text-sm font-bold text-slate-900">
            {selectedDisaster.event_name || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Location
          </p>
          <p className="text-sm text-slate-900">
            {[selectedDisaster.city, selectedDisaster.state]
              .filter(Boolean)
              .join(", ") ||
              `${selectedDisaster.lat.toFixed(4)}°N, ${selectedDisaster.lng.toFixed(4)}°E`}
          </p>
        </div>

        <div className="flex gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Event Type
            </p>
            <span
              className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                EVENT_TYPE_COLORS[selectedDisaster.event_type] ||
                EVENT_TYPE_COLORS["Misc"]
              }`}
            >
              {selectedDisaster.event_type}
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">
              Alert Level
            </p>
            <p
              className={`text-sm font-semibold capitalize ${
                selectedDisaster.alert_level === "Red" ||
                selectedDisaster.alert_level === "Orange"
                  ? "text-red-600"
                  : selectedDisaster.alert_level === "Yellow"
                  ? "text-amber-600"
                  : "text-slate-600"
              }`}
            >
              {selectedDisaster.alert_level || "—"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Risk Level
          </p>
          <p className="text-sm text-slate-900">
            {selectedDisaster.proximity_severity_level || "—"}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Event Period
          </p>
          <p className="text-sm text-slate-900">
            {selectedDisaster.date
              ? `${new Date(selectedDisaster.date).toLocaleDateString()} – ${new Date(selectedDisaster.end_date).toLocaleDateString()}`
              : new Date(selectedDisaster.created_time).toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">
            Affected Area
          </p>
          {loadingPolygon ? (
            <p className="text-xs text-slate-500">
              Loading polygon…
            </p>
          ) : polygon ? (
            <p className="font-semibold text-xs text-emerald-600">
              Polygon loaded ({polygon.length} points)
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Point event — no polygon boundary
              available from NASA EONET/GDACS
            </p>
          )}
        </div>

        {selectedDisaster.details &&
          Object.keys(selectedDisaster.details).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Impact Details
              </p>
              <div className="mt-1 space-y-1">
                {Object.entries(selectedDisaster.details).map(
                  ([key, value]) =>
                    value != null ? (
                      <div
                        key={key}
                        className="flex justify-between text-[11px]"
                      >
                        <span className="capitalize text-slate-500">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {String(value)}
                        </span>
                      </div>
                    ) : null
                )}
              </div>
            </div>
          )}

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">
            Investigation
          </p>

          {!investigationId ? (
            <>
              {!nearestTeam && !investigating && (
                <Button
                  size="sm"
                  onClick={onInvestigate}
                  className="w-full gap-2 bg-amber-600 font-semibold text-white hover:bg-amber-700"
                >
                  <Search className="h-4 w-4" />
                  Investigate
                </Button>
              )}

              {investigating && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                  <span className="text-xs font-semibold text-slate-600">
                    Finding nearest team...
                  </span>
                </div>
              )}

              {nearestTeam && (
                <div className="space-y-2">
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
                    <p className="text-xs font-bold text-amber-900">
                      Nearest Team
                    </p>
                    <p className="text-sm font-semibold text-amber-800">
                      {nearestTeam.teamName}
                    </p>
                    <p className="text-[11px] text-amber-700">
                      {nearestTeam.district}, {nearestTeam.province}
                    </p>
                    <p className="text-[11px] text-amber-700">
                      {nearestTeam.distanceKm} km · ~{nearestTeam.etaMinutes}{" "}
                      min ETA
                    </p>
                    <p className="text-[11px] text-amber-700">
                      Leader: {nearestTeam.leadName} ({nearestTeam.leadPhone})
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={onAssignInvestigation}
                    className="w-full gap-2 bg-red-600 font-semibold text-white hover:bg-red-700"
                  >
                    <UserPlus className="h-4 w-4" />
                    Assign Team
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div
              className={`rounded-lg border p-2 ${
                isInvestigationComplete
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <p
                className={`text-xs font-bold ${
                  isInvestigationComplete
                    ? "text-emerald-900"
                    : "text-amber-900"
                }`}
              >
                {isInvestigationComplete
                  ? "Investigation Investigated"
                  : "Investigation Active"}
              </p>
              <p className="text-[11px] text-emerald-700">
                ID: {investigationId}
              </p>
              <p className="text-[11px] text-emerald-700">
                Status:{" "}
                {getInvestigationDisplayStatus(
                  currentInvestigationStatus,
                  currentAssessment
                )}
              </p>
              {currentAssessment && (
                <p className="text-[11px] text-emerald-700">
                  Assessment:{" "}
                  {currentAssessment.replace(/_/g, " ")}
                </p>
              )}
              <p className="text-[11px] text-emerald-700">
                Assigned: Team assigned
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
