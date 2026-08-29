"use client";

import React, { useRef } from "react";
import { Radio, Layers, MapPin, ImageIcon, Upload, X, Send } from "lucide-react";
import { NEPAL_REGIONS } from "@/app/notifications/page";

interface BroadcastComposerProps {
  title: string;
  setTitle: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  targetScope: "all" | "targeted";
  setTargetScope: (v: "all" | "targeted") => void;
  selectedProvince: string;
  setSelectedProvince: (v: string) => void;
  selectedDistrict: string;
  setSelectedDistrict: (v: string) => void;
  severity: "critical" | "warning" | "info";
  setSeverity: (v: "critical" | "warning" | "info") => void;
  category: string;
  setCategory: (v: string) => void;
  imageUrl: string;
  imagePreview: string;
  handleImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeImage: () => void;
  uploadingImage: boolean;
  sending: boolean;
  handleBroadcast: (e: React.FormEvent) => Promise<void>;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
}

export function BroadcastComposer(props: BroadcastComposerProps) {
  return (
    <div className="sticky top-6 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <Radio className="h-5 w-5 text-red-600 animate-pulse" />
          <h2 className="text-lg font-bold text-slate-900">Create Broadcast</h2>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-red-700">
          Live Dispatch
        </span>
      </div>

      <form onSubmit={props.handleBroadcast} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Target Scope (Coverage)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => props.setTargetScope("all")}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-bold transition-all ${
                props.targetScope === "all"
                  ? "border-red-600 bg-red-50/80 text-red-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Layers className="h-4 w-4 text-red-600" />
              All Over Nepal 🇳🇵
            </button>

            <button
              type="button"
              onClick={() => props.setTargetScope("targeted")}
              className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-bold transition-all ${
                props.targetScope === "targeted"
                  ? "border-red-600 bg-red-50/80 text-red-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <MapPin className="h-4 w-4 text-red-600" />
              Specific Region
            </button>
          </div>
        </div>

        {props.targetScope === "targeted" && (
          <div className="rounded-2xl border border-red-100 bg-red-50/40 p-4 space-y-3.5 transition-all">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Select Province / State <span className="text-red-500">*</span>
              </label>
              <select
                value={props.selectedProvince}
                onChange={(e) => {
                  props.setSelectedProvince(e.target.value);
                  props.setSelectedDistrict("");
                }}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">-- Choose Province --</option>
                {Object.keys(NEPAL_REGIONS).map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Select District <span className="text-slate-400 font-normal">(Optional — leave for entire province)</span>
              </label>
              <select
                value={props.selectedDistrict}
                onChange={(e) => props.setSelectedDistrict(e.target.value)}
                disabled={!props.selectedProvince}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 disabled:opacity-50 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                <option value="">-- Entire Province (All Districts) --</option>
                {props.selectedProvince &&
                  NEPAL_REGIONS[props.selectedProvince]?.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Severity Level
            </label>
            <select
              value={props.severity}
              onChange={(e) => props.setSeverity(e.target.value as any)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-red-500 focus:outline-none"
            >
              <option value="critical">🔴 Critical Emergency</option>
              <option value="warning">🟡 Warning / Alert</option>
              <option value="info">🔵 Advisory Info</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-600">
              Category
            </label>
            <select
              value={props.category}
              onChange={(e) => props.setCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 focus:border-red-500 focus:outline-none"
            >
              <option value="Disaster Alert">Flood / Landslide</option>
              <option value="Weather Warning">Blizzard / Snowstorm</option>
              <option value="Earthquake Alert">Earthquake Notice</option>
              <option value="Evacuation Order">Evacuation Order</option>
              <option value="Medical Advisory">Medical Advisory</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Alert Headline <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={props.title}
            onChange={(e) => props.setTitle(e.target.value)}
            placeholder="e.g. Flash Flood Warning: Solukhumbu River Basin"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-bold text-slate-700">
            Detailed Advisory Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={props.message}
            onChange={(e) => props.setMessage(e.target.value)}
            rows={5}
            required
            placeholder="Provide explicit instructions, evacuation routes, or safety precautions..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>

        <div>
          <label className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-700">
            <ImageIcon className="h-4 w-4 text-slate-400" />
            Attach Visual Map / Reference Image (Optional)
          </label>

          {props.imagePreview ? (
            <div className="relative mt-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
              <img
                src={props.imagePreview}
                alt="Preview"
                className={`h-40 w-full object-cover transition-opacity ${props.uploadingImage ? "opacity-40" : "opacity-100"}`}
              />
              {props.uploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex items-center gap-2 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                    <Upload className="h-3 w-3 animate-bounce" /> Uploading to Cloudinary...
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={props.removeImage}
                disabled={props.uploadingImage}
                className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white backdrop-blur hover:bg-red-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={props.handleImageFileChange}
                className="hidden"
                id="file-upload"
                ref={props.fileInputRef}
              />
              <label
                htmlFor="file-upload"
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <Upload className="h-5 w-5" />
                <span className="text-sm font-semibold">Click to upload evacuation map or chart</span>
              </label>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={props.sending || props.uploadingImage}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 disabled:opacity-70"
        >
          {props.sending ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {props.sending ? "Transmitting Alert..." : "Broadcast Emergency Alert"}
        </button>
      </form>
    </div>
  );
}
