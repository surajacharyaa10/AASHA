"use client";

import { useState } from "react";
import { Settings, Save, AlertTriangle } from "lucide-react";

export function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    autoDispatch: true,
    smsAlerts: true,
    maintenanceMode: false,
    dataRetention: "90",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert("System preferences updated!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">System Preferences</h2>
        <p className="text-sm text-slate-500">Configure core Aasha platform behaviors and automation.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        
        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Automated Dispatch Routing</h3>
              <p className="text-xs text-slate-500">Automatically assign SOS events to the nearest available rescue team based on proximity.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={settings.autoDispatch} onChange={(e) => setSettings({...settings, autoDispatch: e.target.checked})} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">SMS Gateway Alerts</h3>
              <p className="text-xs text-slate-500">Send critical SMS notifications to field commanders upon dispatch.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={settings.smsAlerts} onChange={(e) => setSettings({...settings, smsAlerts: e.target.checked})} className="peer sr-only" />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-red-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Data Retention Period (Days)</label>
            <select
              value={settings.dataRetention}
              onChange={(e) => setSettings({...settings, dataRetention: e.target.value})}
              className="w-full rounded-xl border border-slate-200 py-2.5 px-4 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            >
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
              <option value="365">1 Year</option>
              <option value="forever">Indefinite (Archived)</option>
            </select>
            <p className="text-xs text-slate-500">How long resolved SOS events and logs are kept in hot storage.</p>
          </div>
        </div>

        <div className="space-y-4 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-orange-500" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-orange-900">Maintenance Mode</h3>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})} className="peer sr-only" />
                  <div className="peer h-6 w-11 rounded-full bg-orange-300/50 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-white after:bg-white after:transition-all after:content-[''] peer-checked:bg-orange-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300"></div>
                </label>
              </div>
              <p className="mt-1 text-xs text-orange-700">Enabling this prevents new field reports from being submitted while system upgrades are performed. Only enable during scheduled downtime.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Save className="h-4 w-4" />}
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
