"use client";

import React, { useState, useEffect } from "react";
import { Shield, UserPlus, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { NEPAL_REGIONS } from "@/app/notifications/page";
import type { TeamMemberInput, RegistrationRecord } from "@/components/team-registration/types";
import { BACKEND_URL } from "@/components/team-registration/types";
import { RegistrationForm } from "@/components/team-registration/RegistrationForm";
import { ApplicationsList } from "@/components/team-registration/ApplicationsList";

export default function TeamRegistrationPage() {
  const [activeTab, setActiveTab] = useState<"register" | "applications">("register");
  const [applications, setApplications] = useState<RegistrationRecord[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [teamName, setTeamName] = useState("");
  const [station, setStation] = useState("");
  const [province, setProvince] = useState("Bagmati Province");
  const [district, setDistrict] = useState("Kathmandu");

  // Leader State
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCitizenshipNumber, setLeadCitizenshipNumber] = useState("");
  const [leadCitizenshipDocUrl, setLeadCitizenshipDocUrl] = useState("");
  const [uploadingLeadDoc, setUploadingLeadDoc] = useState(false);

  // Official Team Recommendation / Registration Letter Document
  const [teamLetterDocUrl, setTeamLetterDocUrl] = useState("");
  const [uploadingTeamLetter, setUploadingTeamLetter] = useState(false);

  // Capabilities
  const [selectedCapabilities, setSelectedCapabilities] = useState<string[]>([
    "Rope & Cliff Rescue",
    "Trauma & Emergency First Aid",
  ]);

  // Team Members
  const [members, setMembers] = useState<TeamMemberInput[]>([
    {
      id: "mem-1", name: "", email: "", phone: "", role: "Rescue Specialist", citizenshipNumber: "", citizenshipDocUrl: "",
    },
  ]);

  const [toast, setToast] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await fetch(`${BACKEND_URL}/api/team-registrations`);
      const data = await res.json();
      if (data?.registrations) setApplications(data.registrations);
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    if (activeTab === "applications") fetchApplications();
  }, [activeTab]);

  const handleUploadDoc = async (file: File, onSuccess: (url: string) => void, setLoadingState: (loading: boolean) => void) => {
    try {
      setLoadingState(true);
      const formData = new FormData();
      formData.append("document", file);
      const res = await fetch(`${BACKEND_URL}/api/team-registrations/upload-doc`, { method: "POST", body: formData });
      const data = await res.json();
      if (data?.url) {
        onSuccess(data.url);
        showToast("✓ Document verified & uploaded to Cloudinary", "success");
      } else {
        showToast(data?.error || "Failed to upload document", "error");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast("Upload failed. Check connection.", "error");
    } finally {
      setLoadingState(false);
    }
  };

  const addMember = () => setMembers((prev) => [...prev, { id: `mem-${Date.now()}`, name: "", email: "", phone: "", role: "Field Responder", citizenshipNumber: "", citizenshipDocUrl: "" }]);
  const removeMember = (id: string) => setMembers((prev) => prev.filter((m) => m.id !== id));
  const updateMember = (id: string, field: keyof TeamMemberInput, val: any) => setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: val } : m)));
  const toggleCapability = (cap: string) => setSelectedCapabilities((prev) => prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !leadName || !leadEmail || !leadPhone) {
      showToast("Please fill in all required team and leader information", "error");
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        teamName, station, province, district, leadName, leadEmail, leadPhone,
        leadCitizenshipNumber, leadCitizenshipDocUrl, teamLetterDocUrl,
        capabilities: selectedCapabilities, members: members.filter((m) => m.name.trim() && m.email.trim()),
      };
      const res = await fetch(`${BACKEND_URL}/api/team-registrations`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data?.success) {
        showToast("🎉 Rescue Team Registration submitted successfully!", "success");
        setTeamName(""); setStation(""); setLeadName(""); setLeadEmail(""); setLeadPhone("");
        setLeadCitizenshipNumber(""); setLeadCitizenshipDocUrl(""); setTeamLetterDocUrl(""); setMembers([]);
        setActiveTab("applications");
      } else {
        showToast(data?.error || "Registration failed", "error");
      }
    } catch (err) {
      console.error("Submission failed:", err);
      showToast("Network error submitting registration", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/team-registrations/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (res.ok) {
        showToast(`Team application ${status}`, "success");
        fetchApplications();
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10 font-sans text-slate-900">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3 shadow-2xl text-sm font-semibold text-white animate-in fade-in slide-in-from-bottom-5 ${toast.type === "success" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
              <Shield className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Rescue Team Onboarding & Verification</h1>
              <p className="text-sm font-medium text-slate-500">Register volunteer rescue teams, verify official letters, leader & member citizenship documents</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
            <button onClick={() => setActiveTab("register")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "register" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}>
              <UserPlus className="h-4 w-4" /> Register New Team
            </button>
            <button onClick={() => setActiveTab("applications")} className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "applications" ? "bg-slate-900 text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"}`}>
              <FileText className="h-4 w-4" /> Applications & Verification ({applications.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === "register" && (
        <RegistrationForm
          teamName={teamName} setTeamName={setTeamName} station={station} setStation={setStation} province={province} setProvince={setProvince} district={district} setDistrict={setDistrict} leadName={leadName} setLeadName={setLeadName} leadEmail={leadEmail} setLeadEmail={setLeadEmail} leadPhone={leadPhone} setLeadPhone={setLeadPhone} leadCitizenshipNumber={leadCitizenshipNumber} setLeadCitizenshipNumber={setLeadCitizenshipNumber} leadCitizenshipDocUrl={leadCitizenshipDocUrl} setLeadCitizenshipDocUrl={setLeadCitizenshipDocUrl} uploadingLeadDoc={uploadingLeadDoc} teamLetterDocUrl={teamLetterDocUrl} setTeamLetterDocUrl={setTeamLetterDocUrl} uploadingTeamLetter={uploadingTeamLetter} selectedCapabilities={selectedCapabilities} toggleCapability={toggleCapability} members={members} addMember={addMember} removeMember={removeMember} updateMember={updateMember} handleSubmit={handleSubmit} submitting={submitting} handleUploadDoc={handleUploadDoc} setUploadingLeadDoc={setUploadingLeadDoc} setUploadingTeamLetter={setUploadingTeamLetter}
        />
      )}
      {activeTab === "applications" && (
        <ApplicationsList applications={applications} loadingApps={loadingApps} fetchApplications={fetchApplications} handleUpdateStatus={handleUpdateStatus} />
      )}
    </div>
  );
}
