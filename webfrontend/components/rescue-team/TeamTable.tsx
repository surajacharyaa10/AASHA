"use client";

import { Download, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { RescueTeam } from "@/components/rescue-team/rescue-map";

interface TeamTableProps {
  teams: RescueTeam[];
  selectedTeam: RescueTeam | null;
  onRowClick: (team: RescueTeam) => void;
  onOpenDetails: (team: RescueTeam, e: React.MouseEvent) => void;
  onExportTeam: (team: RescueTeam, e: React.MouseEvent) => void;
}

export function TeamTable({
  teams,
  selectedTeam,
  onRowClick,
  onOpenDetails,
  onExportTeam,
}: TeamTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3.5">Rescue Team</th>
              <th className="px-4 py-3.5">Base Station</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Assignment</th>
              <th className="px-4 py-3.5">Readiness</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {teams.map((team) => {
              const isSelected = selectedTeam?.id === team.id;
              return (
                <tr
                  key={team.id}
                  onClick={() => onRowClick(team)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-slate-50/90 font-medium"
                      : "hover:bg-slate-50/60"
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-xs">
                        {team.initial}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">{team.name}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">
                          {team.capability}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{team.station}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 pl-5">
                      {team.district}{team.province ? `, ${team.province}` : ""}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <Badge
                      variant={
                        team.availability === "available"
                          ? "success"
                          : team.availability === "deployed"
                          ? "info"
                          : "secondary"
                      }
                      className="capitalize font-semibold"
                    >
                      {team.availability}
                    </Badge>
                  </td>

                  <td className="px-4 py-4">
                    {team.assignment ? (
                      <span className="font-semibold text-blue-600">
                        {team.assignment}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {team.readiness !== null ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            team.readiness >= 90
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : team.readiness >= 70
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {team.readiness}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400">--</span>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => onOpenDetails(team, e)}
                        className="h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View Dossier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => onExportTeam(team, e)}
                        title="Export full team spreadsheet"
                        className="h-8 w-8 p-0 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {teams.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                  No rescue teams match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
