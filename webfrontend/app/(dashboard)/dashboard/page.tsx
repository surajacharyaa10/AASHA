"use client";

import { useState, useMemo, useEffect } from "react";
import { Radio, Users, Clock, RefreshCw, Bell, AlertCircle, Cloud } from "lucide-react";
import { io } from "socket.io-client";
import SosEventDetail, { SosEvent, SosStatus } from "@/app/components/SOSDetails";
import { SosEventQueue } from "@/components/dashboard/SosEventQueue";
import { DashboardMap } from "@/components/dashboard/DashboardMap";
import { BACKEND, mapApiEventToSosEvent } from "@/components/dashboard/types";

function StatCard({ icon, iconBg, label, value, sub }: {
  icon: React.ReactNode; iconBg: string; label: string; value: React.ReactNode; sub: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <p className="text-xs text-slate-500">{sub}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [events, setEvents] = useState<SosEvent[]>([]);
  const [tab, setTab] = useState<SosStatus>("pending");
  const [selectedSosEvent, setSelectedSosEvent] = useState<SosEvent | null>(null);
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/sos`);
        const data = await res.json();
        if (data.events) setEvents(data.events.map(mapApiEventToSosEvent));
      } catch (err) { console.error("Failed to fetch events:", err); }
    };
    fetchEvents();

    const fetchWeather = async (query = 'Kathmandu') => {
      try {
        const res = await fetch(`${BACKEND}/api/weather/current?query=${query}`);
        const data = await res.json();
        if (data.current) setWeather(data.current);
      } catch (err) { console.error("Failed to fetch weather:", err); }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeather(`${latitude},${longitude}`);
        },
        (error) => {
          console.error("Geolocation error, defaulting to Kathmandu", error);
          fetchWeather();
        }
      );
    } else {
      fetchWeather();
    }

    const socket = io(BACKEND);
    socket.on("sos:new", (apiEvent) => {
      setEvents((prev) => {
        if (prev.some((e) => e.id === apiEvent.packetId)) return prev;
        return [mapApiEventToSosEvent(apiEvent), ...prev];
      });
    });
    socket.on("sos:updated", (apiEvent) => {
      setEvents((prev) => prev.map((e) => {
        if (e.id !== apiEvent.packetId) return e;
        return {
          ...e,
          status: apiEvent.status || e.status,
          assignedTeam: apiEvent.assignedTeamName || e.assignedTeam,
          priorityLabel:
            apiEvent.status === "resolved" ? "Resolved · Mission Complete" :
            apiEvent.status === "false_alarm" ? "False Alarm · Cleared" :
            apiEvent.status === "on_scene" ? "Priority 4 · On Scene" :
            apiEvent.status === "en_route" ? "Priority 3 · Team En Route" :
            apiEvent.status === "assigned" ? "Priority 2 · Unit En Route" : e.priorityLabel,
          meta:
            apiEvent.status === "resolved" ? "Closed & resolved · Just now" :
            apiEvent.status === "false_alarm" ? "False alarm · Cleared" :
            apiEvent.status === "on_scene" ? "Team on scene · Just now" :
            apiEvent.status === "en_route" ? "Team en route · Just now" :
            apiEvent.status === "assigned" ? `${apiEvent.assignedTeamName || "Team"} assigned · Just now` : e.meta,
        };
      }));
    });
    return () => { socket.disconnect(); };
  }, []);

  const counts = useMemo(() => ({
    pending: events.filter((e) => e.status === "pending").length,
    assigned: events.filter((e) => e.status === "assigned").length,
    en_route: events.filter((e) => e.status === "en_route").length,
    on_scene: events.filter((e) => e.status === "on_scene").length,
    false_alarm: events.filter((e) => e.status === "false_alarm").length,
    resolved: events.filter((e) => e.status === "resolved").length,
  }), [events]);

  const handleAssignTeam = (eventId: string, teamName: string) => {
    setEvents((prev) => prev.map((e) => e.id !== eventId ? e : {
      ...e, status: "assigned", assignedTeam: teamName,
      priorityLabel: "Priority 2 · Unit En Route", meta: `${teamName} assigned · Just now`,
    }));
  };

  const handleResolveEvent = async (eventId: string) => {
    setEvents((prev) => prev.map((e) => e.id !== eventId ? e : {
      ...e, status: "resolved", meta: "Closed & resolved · Just now",
    }));
    await fetch(`${BACKEND}/api/sos/${eventId}/resolve`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution: "resolved" }),
    }).catch(console.error);
  };

  if (selectedSosEvent) {
    const freshEvent = events.find((e) => e.id === selectedSosEvent.id) ?? selectedSosEvent;
    return (
      <SosEventDetail
        event={freshEvent}
        onBack={() => setSelectedSosEvent(null)}
        onAssignTeam={handleAssignTeam}
        onResolve={handleResolveEvent}
      />
    );
  }

  return (
    <div className="flex h-screen flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xs">
            <Radio className="h-5 w-5" />
          </div>
          <p className="text-sm font-bold tracking-wide text-slate-900">AASHA</p>
          <div className="ml-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Network stable
          </div>
          {weather && (
            <div className="ml-4 flex items-center gap-1.5 text-xs text-slate-500 border-l border-slate-200 pl-4">
              <Cloud className="h-3.5 w-3.5 text-slate-400" />
              <span>{weather.temperature}°C, {weather.weather_descriptions?.[0]}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50">
            <RefreshCw className="h-3.5 w-3.5" /> Live sync
          </button>
          <button className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:bg-slate-50">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">RK</div>
        </div>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 px-6 py-4 md:grid-cols-3">
        <StatCard icon={<AlertCircle className="h-5 w-5 text-red-600" />} iconBg="bg-red-50" label="Active SOS" value={events.length} sub={<span className="font-semibold text-red-600">live events</span>} />
        <StatCard icon={<Users className="h-5 w-5 text-blue-600" />} iconBg="bg-blue-50" label="Teams deployed" value={counts.assigned + counts.en_route + counts.on_scene} sub="active missions" />
        <StatCard icon={<Clock className="h-5 w-5 text-emerald-600" />} iconBg="bg-emerald-50" label="Resolved" value={counts.resolved} sub="missions complete" />
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-4 px-6 pb-6">
        <SosEventQueue
          events={events}
          tab={tab}
          counts={counts}
          onTabChange={setTab}
          onSelectEvent={setSelectedSosEvent}
        />
        <DashboardMap events={events} onSelectEvent={setSelectedSosEvent} />
      </div>
    </div>
  );
}
