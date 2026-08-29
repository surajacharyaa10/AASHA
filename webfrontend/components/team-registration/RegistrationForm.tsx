"use client";

import React, { useState } from "react";
import {
  Building2,
  Shield,
  Upload,
  CheckCircle2,
  X,
  ExternalLink,
  Users,
  Plus,
  Trash2,
  MapPin,
  Check,
} from "lucide-react";
import { NEPAL_REGIONS } from "@/app/notifications/page";
import type { TeamMemberInput } from "./types";
import { RESCUE_CAPABILITIES } from "./types";

interface RegistrationFormProps {
  teamName: string;
  setTeamName: (v: string) => void;
  station: string;
  setStation: (v: string) => void;
  province: string;
  setProvince: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  leadName: string;
  setLeadName: (v: string) => void;
  leadEmail: string;
  setLeadEmail: (v: string) => void;
  leadPhone: string;
  setLeadPhone: (v: string) => void;
  leadCitizenshipNumber: string;
  setLeadCitizenshipNumber: (v: string) => void;
  leadCitizenshipDocUrl: string;
  setLeadCitizenshipDocUrl: (v: string) => void;
  uploadingLeadDoc: boolean;
  teamLetterDocUrl: string;
  setTeamLetterDocUrl: (v: string) => void;
  uploadingTeamLetter: boolean;
  selectedCapabilities: string[];
  toggleCapability: (cap: string) => void;
  members: TeamMemberInput[];
  addMember: () => void;
  removeMember: (id: string) => void;
  updateMember: (id: string, field: keyof TeamMemberInput, val: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  handleUploadDoc: (file: File, onSuccess: (url: string) => void, setLoading: (l: boolean) => void) => void;
  setUploadingLeadDoc: (l: boolean) => void;
  setUploadingTeamLetter: (l: boolean) => void;
}

export function RegistrationForm(props: RegistrationFormProps) {
  return (
    <form onSubmit={props.handleSubmit} className="space-y-8 max-w-5xl">
      {/* SECTION 1: Team & Station Identity */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <Building2 className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900">
            1. Team & Base Station Details
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Rescue Team Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={props.teamName}
              onChange={(e) => props.setTeamName(e.target.value)}
              placeholder="e.g. Everest Alpine Rescue Squad"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Base Station / Outpost Location <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={props.station}
              onChange={(e) => props.setStation(e.target.value)}
              placeholder="e.g. Namche Bazaar Station"
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Province / State <span className="text-red-500">*</span>
            </label>
            <select
              value={props.province}
              onChange={(e) => {
                props.setProvince(e.target.value);
                props.setDistrict(NEPAL_REGIONS[e.target.value]?.[0] || "");
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
            >
              {Object.keys(NEPAL_REGIONS).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              District <span className="text-red-500">*</span>
            </label>
            <select
              value={props.district}
              onChange={(e) => props.setDistrict(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none"
            >
              {NEPAL_REGIONS[props.province]?.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Official Team Letter Document (Cloudinary) */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Official Authorization / Recommendation Letter (PDF or Image)
          </label>

          {props.teamLetterDocUrl ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">
                    Official Letter Uploaded & Verified
                  </p>
                  <a href={props.teamLetterDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 underline">
                    View Document in Cloudinary CDN <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <button type="button" onClick={() => props.setTeamLetterDocUrl("")} className="rounded-lg bg-emerald-200/50 p-1.5 text-emerald-800 hover:bg-emerald-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input type="file" id="team-letter-upload" accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) props.handleUploadDoc(file, props.setTeamLetterDocUrl, props.setUploadingTeamLetter);
                }} className="hidden" />
              <label htmlFor="team-letter-upload" className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center transition hover:border-red-300 hover:bg-red-50/30">
                <Upload className={`h-5 w-5 ${props.uploadingTeamLetter ? "animate-bounce text-red-600" : "text-slate-400"}`} />
                <span className="text-xs font-bold text-slate-700">
                  {props.uploadingTeamLetter ? "Uploading official team letter to Cloudinary..." : "Upload Team Registration / Municipal Recommendation Letter"}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: Team Leader Details */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <Shield className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900">2. Team Leader / Commander Profile</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leader Full Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={props.leadName} onChange={(e) => props.setLeadName(e.target.value)} placeholder="e.g. Captain Dawa Sherpa" required className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leader Gmail / Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={props.leadEmail} onChange={(e) => props.setLeadEmail(e.target.value)} placeholder="e.g. dawa.rescue@gmail.com" required className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leader Phone / Hotline <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={props.leadPhone} onChange={(e) => props.setLeadPhone(e.target.value)} placeholder="+977 98XXXXXXXX" required className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Leader Citizenship / National ID No. <span className="text-red-500">*</span>
            </label>
            <input type="text" value={props.leadCitizenshipNumber} onChange={(e) => props.setLeadCitizenshipNumber(e.target.value)} placeholder="e.g. 12-01-78-04321" required className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-red-500 focus:bg-white focus:outline-none" />
          </div>
        </div>

        {/* Leader Citizenship Upload */}
        <div className="mt-6 border-t border-slate-100 pt-5">
          <label className="mb-1.5 block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Leader Citizenship Document Copy (Front/Back)
          </label>
          {props.leadCitizenshipDocUrl ? (
            <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-emerald-900">Leader Citizenship Attached</p>
                  <a href={props.leadCitizenshipDocUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 underline">
                    View Uploaded Document <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
              <button type="button" onClick={() => props.setLeadCitizenshipDocUrl("")} className="rounded-lg bg-emerald-200/50 p-1.5 text-emerald-800 hover:bg-emerald-200">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input type="file" id="lead-doc-upload" accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) props.handleUploadDoc(file, props.setLeadCitizenshipDocUrl, props.setUploadingLeadDoc);
                }} className="hidden" />
              <label htmlFor="lead-doc-upload" className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-5 text-center transition hover:border-red-300 hover:bg-red-50/30">
                <Upload className={`h-5 w-5 ${props.uploadingLeadDoc ? "animate-bounce text-red-600" : "text-slate-400"}`} />
                <span className="text-xs font-bold text-slate-700">
                  {props.uploadingLeadDoc ? "Uploading..." : "Upload Leader Citizenship Document"}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Capabilities */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <MapPin className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900">3. Operational Capabilities</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {RESCUE_CAPABILITIES.map((cap) => (
            <label key={cap} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-all hover:bg-slate-50 ${props.selectedCapabilities.includes(cap) ? "border-red-600 bg-red-50/30" : "border-slate-200 bg-white"}`}>
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${props.selectedCapabilities.includes(cap) ? "border-red-600 bg-red-600" : "border-slate-300 bg-white"}`}>
                {props.selectedCapabilities.includes(cap) && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
              </div>
              <span className="text-sm font-bold text-slate-700">{cap}</span>
            </label>
          ))}
        </div>
      </div>

      {/* SECTION 4: Team Members */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
          <Users className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-black text-slate-900">4. Register Team Members</h2>
        </div>
        <div className="space-y-4">
          {props.members.map((member, index) => (
            <div key={member.id} className="relative rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-700">{index + 1}</span> Member
                </span>
                {props.members.length > 1 && (
                  <button type="button" onClick={() => props.removeMember(member.id)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Full Name</label>
                  <input type="text" value={member.name} onChange={(e) => props.updateMember(member.id, "name", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Email Address</label>
                  <input type="email" value={member.email} onChange={(e) => props.updateMember(member.id, "email", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Phone</label>
                  <input type="tel" value={member.phone} onChange={(e) => props.updateMember(member.id, "phone", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Role / Speciality</label>
                  <input type="text" value={member.role} onChange={(e) => props.updateMember(member.id, "role", e.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none" required />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={props.addMember} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-white py-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
            <Plus className="h-4 w-4" /> Add Another Member
          </button>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={props.submitting} className="flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-slate-800 hover:shadow-xl disabled:opacity-70">
          {props.submitting ? "Submitting Application..." : "Submit Team Registration"}
        </button>
      </div>
    </form>
  );
}
