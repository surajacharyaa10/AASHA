"use client";

import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Lock, User, ShieldAlert, ArrowRight, Activity, Clock, Shield } from "lucide-react";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#020617] lg:flex-row text-slate-100">
      {/* Left Pane - Marketing & Info */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0b1530] via-[#020617] to-[#020617] p-8 lg:w-[50%] xl:w-[55%] lg:p-12 border-b border-slate-800 lg:border-b-0 lg:border-r border-slate-800/50">
        {/* Subtle Decorative Glows */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-blue-500/10 blur-[100px]" />
        <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-red-500/5 blur-[120px]" />
        
        {/* Header Branding */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-md shadow-red-500/20">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight uppercase leading-none">Aasha</h2>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Nepal Disaster SOS Network</span>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            System operational
          </div>
        </div>

        {/* Central Hero Message */}
        <div className="relative z-10 my-16 max-w-xl lg:my-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-red-500">Emergency operations access</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-white leading-tight">
            Coordinate every SOS response with clarity.
          </h1>
          <p className="mt-6 text-base font-medium text-slate-400 leading-relaxed">
            Aasha connects emergency signals across Nepal with the people and teams ready to respond. Empowering disaster management dispatch and field teams with real-time sync.
          </p>

          {/* Quick Metrics */}
          <div className="mt-12 grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-8">
            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <Activity className="h-3.5 w-3.5 text-red-400" />
                Active SOS
              </div>
              <p className="mt-2 text-2xl font-black text-white">12</p>
            </div>

            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
                Teams active
              </div>
              <p className="mt-2 text-2xl font-black text-white">08</p>
            </div>

            <div className="rounded-2xl bg-slate-900/40 border border-slate-800/50 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-medium uppercase tracking-wider">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Avg response
              </div>
              <p className="mt-2 text-2xl font-black text-white">06m</p>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 font-semibold border-t border-slate-800/30 pt-6">
          <span>Aasha v2.0 - Nepal Emergency Response</span>
          <span>Last network sync: 04:12 NPT</span>
        </div>
      </div>

      {/* Right Pane - Sign In Form (White BG, Dark Text) */}
      <div className="flex flex-col justify-center bg-white px-6 py-12 lg:w-[50%] xl:w-[45%] lg:px-16 xl:px-24 text-slate-900">
        <div className="mx-auto w-full max-w-md">
          {/* Header */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-600">Secure sign in</span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Enter the command center
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Use your assigned Aasha administrator account.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="mt-8 space-y-6">
            {state?.error && (
              <div className="animate-in fade-in slide-in-from-top-2 rounded-xl border border-red-200 bg-red-50 p-4 text-center text-sm font-bold text-red-600">
                {state.error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Enter administrator username"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4.5 w-4.5 text-slate-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="Enter your secure password"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 transition-all placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-red-500/10"
                />
              </div>
            </div>

            {/* Extra Options */}
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 bg-white text-red-600 focus:ring-red-500/10 focus:ring-offset-0"
                />
                Keep this device trusted
              </label>
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="text-red-600 hover:text-red-500 transition-colors"
              >
                Request access
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.99] disabled:opacity-70 shadow-lg shadow-slate-900/10"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <>
                  <span>Open live dispatch</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Compliance Auditing Note */}
          <p className="mt-12 text-center text-xs font-medium text-slate-400 leading-relaxed">
            Session access is audited. Contact{" "}
            <span className="text-slate-600 font-semibold">
              National Emergency Operations
            </span>{" "}
            if you cannot sign in.
          </p>
        </div>
      </div>
    </div>
  );
}