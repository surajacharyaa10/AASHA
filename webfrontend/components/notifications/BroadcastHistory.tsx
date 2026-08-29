"use client";

import { RefreshCw, Bell, Trash2 } from "lucide-react";
import type { NotificationItem } from "@/components/notifications/types";

interface BroadcastHistoryProps {
  notifications: NotificationItem[];
  loading: boolean;
  fetchNotifications: () => void;
  handleDelete: (id: string) => Promise<void>;
}

export function BroadcastHistory({
  notifications,
  loading,
  fetchNotifications,
  handleDelete,
}: BroadcastHistoryProps) {
  return (
    <div className="lg:col-span-7 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">
          Active Broadcasts & History ({notifications.length})
        </h2>
        <span className="text-xs font-semibold text-slate-400">
          Real-time Socket.io Sync
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
          <RefreshCw className="h-6 w-6 animate-spin text-red-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Bell className="mb-3 h-10 w-10 text-slate-300" />
          <h3 className="text-base font-bold text-slate-700">No Notifications Sent Yet</h3>
          <p className="max-w-md text-xs text-slate-400 mt-1">
            When administrators dispatch emergency warnings, they will appear here and be instantly delivered to mobile devices via BLE Mesh and Push API.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((item) => {
            const isAllNepal = item.targetScope === "all";
            const isCritical = item.severity === "critical";

            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold ${
                        isCritical
                          ? "bg-red-100 text-red-700"
                          : item.severity === "warning"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {isCritical ? "🚨" : item.severity === "warning" ? "⚠️" : "ℹ️"}
                    </span>
                    <div>
                      <h3 className="text-base font-black text-slate-900">{item.title}</h3>
                      <p className="text-xs font-medium text-slate-400">
                        {item.category || "Emergency Notice"} ·{" "}
                        {new Date(item.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Scope Badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isAllNepal
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-indigo-100 text-indigo-800"
                      }`}
                    >
                      {isAllNepal
                        ? "🇳🇵 All Nepal"
                        : `${item.province}${item.district ? ` · ${item.district}` : ""}`}
                    </span>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Message Body */}
                <p className="mt-3.5 text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {item.message}
                </p>

                {/* Attached Image */}
                {item.imageUrl && (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-950">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="max-h-64 w-full object-cover"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
