"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import BACKEND_URL_CONFIG from "@/lib/config";

const BACKEND_URL = BACKEND_URL_CONFIG;

type RegistrationStatus = "pending_verification" | "approved" | "rejected";

interface TeamRegistration {
  id: string;
  teamName: string;
  station: string;
  district: string;
  province: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  capabilities: string[];
  membersCount: number;
  status: RegistrationStatus;
  createdAt: string;
}

const STATUS_META: Record<
  RegistrationStatus,
  { label: string; badge: "success" | "info" | "secondary" | "destructive"; icon: typeof CheckCircle2 }
> = {
  approved: { label: "Approved", badge: "success", icon: CheckCircle2 },
  pending_verification: { label: "Pending", badge: "info", icon: Clock },
  rejected: { label: "Rejected", badge: "destructive", icon: XCircle },
};

export default function TeamManagementPage() {
  const [teams, setTeams] = useState<TeamRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RegistrationStatus>("all");
  const [pendingDelete, setPendingDelete] = useState<TeamRegistration | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/team-registrations`);
      const data = await res.json();
      if (data?.registrations) {
        setTeams(
          data.registrations.map((r: any) => ({
            id: r.id || r._id,
            teamName: r.teamName,
            station: r.station,
            district: r.district,
            province: r.province,
            leadName: r.leadName,
            leadEmail: r.leadEmail,
            leadPhone: r.leadPhone,
            capabilities: r.capabilities || [],
            membersCount: r.membersCount || 0,
            status: r.status,
            createdAt: r.createdAt,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load teams:", err);
      setToast({ type: "error", message: "Failed to load teams" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => {
    const c = { approved: 0, pending_verification: 0, rejected: 0 };
    teams.forEach((t) => (c[t.status] = (c[t.status] || 0) + 1));
    return c;
  }, [teams]);

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const matchesQuery =
        t.teamName.toLowerCase().includes(query.toLowerCase()) ||
        t.station.toLowerCase().includes(query.toLowerCase()) ||
        t.leadName.toLowerCase().includes(query.toLowerCase()) ||
        t.district.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "all" || t.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [teams, query, statusFilter]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`${BACKEND_URL}/api/team-registrations/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete team");
      setTeams((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      setToast({ type: "success", message: `"${pendingDelete.teamName}" deleted successfully` });
    } catch (err: any) {
      console.error("Failed to delete team:", err);
      setToast({ type: "error", message: err.message || "Failed to delete team" });
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" render={<Link href="/dashboard" />} className="h-9 w-9 border-slate-200">
            <ArrowLeft className="h-4 w-4 text-slate-600" />
          </Button>
          <div>
            <p className="text-xs font-medium text-slate-400">Aasha Operations</p>
            <h1 className="text-lg font-bold text-slate-900">Team Management</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={fetchTeams} className="gap-2 border-slate-200 font-medium text-slate-700 hover:bg-slate-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-red-600" : ""}`} /> Refresh
          </Button>
          <Button render={<Link href="/team-registration" />} className="gap-2 bg-red-600 font-medium text-white hover:bg-red-700 shadow-xs">
            <Users className="h-4 w-4" /> Register Team
          </Button>
        </div>
      </header>

      <main className="px-6 py-6">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-slate-900">Manage Rescue Teams</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review every registration and remove teams that are no longer active.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Approved</p>
              <span className="text-2xl font-bold text-slate-900">{counts.approved}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending</p>
              <span className="text-2xl font-bold text-slate-900">{counts.pending_verification}</span>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Rejected</p>
              <span className="text-2xl font-bold text-slate-900">{counts.rejected}</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by team, station, leader, or district…"
              className="pl-9"
            />
          </div>
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
            {(["all", "approved", "pending_verification", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all ${
                  statusFilter === s
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {s === "all" ? "All" : STATUS_META[s].label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
            <span className="ml-3 text-sm font-semibold text-slate-600">Loading teams…</span>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-14 text-center">
            <Users className="mb-3 h-10 w-10 text-slate-300" />
            <h3 className="text-base font-bold text-slate-700">No Teams Registered</h3>
            <p className="mt-1 max-w-sm text-xs text-slate-400">
              Registrations appear here once submitted through Team Registration.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="px-5 py-3.5">Team</th>
                    <th className="px-4 py-3.5">Base Station</th>
                    <th className="px-4 py-3.5">Leader</th>
                    <th className="px-4 py-3.5">Members</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeams.map((team) => {
                    const meta = STATUS_META[team.status];
                    const StatusIcon = meta.icon;
                    return (
                      <tr key={team.id} className="transition-colors hover:bg-slate-50/60">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white shadow-xs">
                              {(team.teamName || "T").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">{team.teamName}</p>
                              <p className="text-xs text-slate-500 truncate max-w-[200px]">
                                {team.capabilities.join(" · ") || "General Rescue"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="text-slate-700">{team.station}</span>
                          <span className="block text-[11px] text-slate-400">
                            {team.district}{team.province ? `, ${team.province}` : ""}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-medium text-slate-800">{team.leadName}</p>
                          <p className="text-[11px] text-slate-400">{team.leadPhone}</p>
                        </td>
                        <td className="px-4 py-4 text-slate-700">{team.membersCount}</td>
                        <td className="px-4 py-4">
                          <Badge variant={meta.badge} className="capitalize font-semibold">
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPendingDelete(team)}
                            className="h-8 gap-1.5 text-xs font-semibold text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTeams.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                        No teams match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Team</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Are you sure you want to delete{" "}
                  <span className="font-semibold text-slate-800">{pendingDelete.teamName}</span>?
                  This permanently removes the registration and cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPendingDelete(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="gap-2 bg-red-600 font-medium text-white hover:bg-red-700"
              >
                {deleting ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {deleting ? "Deleting…" : "Delete Team"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
