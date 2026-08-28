"use client";

import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Availability, RescueTeam } from "./rescue-map";
import { Shield, MapPin, Phone, Users, Activity } from "lucide-react";

interface AddTeamSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTeam: (team: RescueTeam) => void;
}

const DEFAULT_STATIONS = [
  { name: "Lukla", district: "Solukhumbu", lat: 27.6869, lng: 86.7314 },
  { name: "Namche Bazaar", district: "Solukhumbu", lat: 27.8069, lng: 86.7139 },
  { name: "Phaplu", district: "Solukhumbu", lat: 27.5186, lng: 86.5878 },
  { name: "Salleri", district: "Solukhumbu", lat: 27.502, lng: 86.591 },
  { name: "Pheriche", district: "Solukhumbu", lat: 27.8942, lng: 86.8219 },
  { name: "Pokhara Base", district: "Kaski", lat: 28.2096, lng: 83.9856 },
  { name: "Manang Base", district: "Manang", lat: 28.6644, lng: 84.0205 },
];

export function AddTeamSheet({
  open,
  onOpenChange,
  onAddTeam,
}: AddTeamSheetProps) {
  const [name, setName] = useState("");
  const [capability, setCapability] = useState("");
  const [stationIndex, setStationIndex] = useState(0);
  const [lead, setLead] = useState("");
  const [phone, setPhone] = useState("+977 98");
  const [membersCount, setMembersCount] = useState(6);
  const [availability, setAvailability] = useState<Availability>("available");
  const [readiness, setReadiness] = useState(95);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const selectedStation = DEFAULT_STATIONS[stationIndex];
    const initial = name.trim().replace(/^Team\s+/i, "")[0]?.toUpperCase() || "T";

    const newTeam: RescueTeam = {
      id: `team-${Date.now()}`,
      name: name.startsWith("Team") ? name : `Team ${name}`,
      initial,
      capability: capability.trim() || "Search & Rescue · First Response",
      station: selectedStation.name,
      district: selectedStation.district,
      lead: lead.trim() || "Field Officer",
      phone: phone.trim() || "+977 9800000000",
      membersCount: Number(membersCount) || 6,
      availability,
      assignment: availability === "deployed" ? "SOS-NEP-PENDING" : null,
      readiness: availability === "off-duty" ? null : Number(readiness),
      lat: selectedStation.lat + (Math.random() - 0.5) * 0.02,
      lng: selectedStation.lng + (Math.random() - 0.5) * 0.02,
    };

    onAddTeam(newTeam);
    onOpenChange(false);

    // Reset fields
    setName("");
    setCapability("");
    setLead("");
    setPhone("+977 98");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle>Register Rescue Team</SheetTitle>
              <SheetDescription>
                Deploy a new quick-response unit to the operational field.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Team Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annapurna, Sagarmatha, Everest"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Capabilities / Specialization</label>
            <Input
              value={capability}
              onChange={(e) => setCapability(e.target.value)}
              placeholder="e.g. High altitude · Crevasse rescue · Trauma care"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Base Station</label>
              <select
                value={stationIndex}
                onChange={(e) => setStationIndex(Number(e.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-slate-800 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              >
                {DEFAULT_STATIONS.map((s, idx) => (
                  <option key={s.name} value={idx}>
                    {s.name} ({s.district})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Availability Status</label>
              <select
                value={availability}
                onChange={(e) => setAvailability(e.target.value as Availability)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm text-slate-800 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
              >
                <option value="available">Available</option>
                <option value="deployed">Deployed</option>
                <option value="off-duty">Off-duty</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Team Lead</label>
              <Input
                value={lead}
                onChange={(e) => setLead(e.target.value)}
                placeholder="e.g. Dawa Norbu Sherpa"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Emergency Phone</label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+977 9800000000"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Members Count</label>
              <Input
                type="number"
                min={1}
                max={50}
                value={membersCount}
                onChange={(e) => setMembersCount(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Readiness (%)</label>
              <Input
                type="number"
                min={0}
                max={100}
                value={readiness}
                onChange={(e) => setReadiness(Number(e.target.value))}
                disabled={availability === "off-duty"}
              />
            </div>
          </div>
        </form>

        <SheetFooter className="border-t border-slate-100 p-4 bg-slate-50 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700 text-white">
            Add Team to Roster
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

