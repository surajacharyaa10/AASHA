"use client";

import { useState } from "react";
import { User, Settings, LogOut } from "lucide-react";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SystemSettings } from "@/components/settings/SystemSettings";
import { logout } from "@/app/actions/auth";

type Tab = "profile" | "system";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const tabs = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "system", label: "System Preferences", icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-2xs">
        <div>
          <p className="text-xs font-medium text-slate-400">Administration</p>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
        </div>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-200">
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          
          <aside className="w-full lg:w-64 shrink-0">
            <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                      isActive 
                        ? "bg-slate-900 text-white shadow-md" 
                        : "text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex-1">
            {activeTab === "profile" && <ProfileSettings />}
            {activeTab === "system" && <SystemSettings />}
          </section>

        </div>
      </main>
    </div>
  );
}
