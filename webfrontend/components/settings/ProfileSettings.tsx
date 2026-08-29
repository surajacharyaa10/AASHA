"use client";

import { useState } from "react";
import { User, Mail, Phone, Save, ShieldCheck } from "lucide-react";

export function ProfileSettings() {
  const [loading, setLoading] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate save
    setTimeout(() => {
      setLoading(false);
      alert("Profile updated successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Administrator Profile</h2>
        <p className="text-sm text-slate-500">Update your personal details and contact information.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-6 border-b border-slate-100 pb-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-slate-400 border-2 border-dashed border-slate-300">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Profile Avatar</h3>
            <p className="mb-3 text-xs text-slate-500">JPG, GIF or PNG. Max size of 800K</p>
            <button type="button" className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">
              Upload New Image
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Full Name</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <User className="h-4 w-4 text-slate-400" />
              </div>
              <input type="text" defaultValue="Admin AASHA" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Email Address</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Mail className="h-4 w-4 text-slate-400" />
              </div>
              <input type="email" defaultValue="admin@aasha.gov.np" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Phone Number</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Phone className="h-4 w-4 text-slate-400" />
              </div>
              <input type="tel" defaultValue="+977-9800000000" className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-4 text-sm font-medium focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wide text-slate-500">Role</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <input type="text" disabled defaultValue="Super Administrator" className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-bold text-slate-500" />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-70"
          >
            {loading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
