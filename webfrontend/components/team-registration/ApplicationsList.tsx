"use client";

import { RefreshCw, Users, FileText, Check, X } from "lucide-react";
import type { RegistrationRecord } from "./types";

interface ApplicationsListProps {
  applications: RegistrationRecord[];
  loadingApps: boolean;
  fetchApplications: () => void;
  handleUpdateStatus: (id: string, status: "approved" | "rejected") => void;
}

export function ApplicationsList({
  applications,
  loadingApps,
  fetchApplications,
  handleUpdateStatus,
}: ApplicationsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-900">
          Submitted Rescue Team Applications ({applications.length})
        </h2>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingApps ? "animate-spin text-red-600" : ""}`} />
          Refresh Roster
        </button>
      </div>

      {loadingApps ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
        </div>
      ) : applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Users className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Team Applications Yet</h3>
          <p className="max-w-md text-xs text-slate-400 mt-1">
            New rescue team registrations will appear here for verification and approval.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{app.teamName}</h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold capitalize ${
                        app.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {app.status.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Base: {app.station} · {app.district}, {app.province}
                  </p>
                </div>

                <span className="text-[11px] font-semibold text-slate-400">
                  {new Date(app.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Leader Info */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 space-y-1.5 text-xs">
                <p className="font-bold text-slate-900">
                  Commander: {app.leadName}
                </p>
                <p className="text-slate-600">
                  📧 {app.leadEmail} · 📞 {app.leadPhone}
                </p>
                <p className="text-slate-600">
                  🪪 Citizenship #: {app.leadCitizenshipNumber || "N/A"}
                </p>

                {/* Document Links */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/60 mt-2">
                  {app.leadCitizenshipDocUrl && (
                    <a
                      href={app.leadCitizenshipDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-blue-600 border border-slate-200 hover:bg-blue-50"
                    >
                      <FileText className="h-3 w-3" /> Leader Citizenship
                    </a>
                  )}

                  {app.teamLetterDocUrl && (
                    <a
                      href={app.teamLetterDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-purple-600 border border-slate-200 hover:bg-purple-50"
                    >
                      <FileText className="h-3 w-3" /> Official Team Letter
                    </a>
                  )}
                </div>
              </div>

              {/* Members list */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">
                  Registered Members ({app.members?.length || 0}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {app.members?.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700"
                    >
                      <span>{m.name || `Member ${i + 1}`}</span>
                      <span className="text-slate-400">({m.email})</span>
                      {m.citizenshipDocUrl && (
                        <a
                          href={m.citizenshipDocUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="View Citizenship"
                          className="text-blue-600 hover:underline"
                        >
                          🪪
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              {app.status === "pending_verification" && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleUpdateStatus(app.id, "approved")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs"
                  >
                    <Check className="h-4 w-4" /> Approve & Deploy Team
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(app.id, "rejected")}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-100 py-2.5 text-xs font-bold text-red-700 hover:bg-red-200"
                  >
                    <X className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
