"use client";

import React, { useState, useEffect, useRef } from "react";
import { ShieldAlert, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { io } from "socket.io-client";
import type { NotificationItem } from "@/components/notifications/types";
import { BroadcastComposer } from "@/components/notifications/BroadcastComposer";
import { BroadcastHistory } from "@/components/notifications/BroadcastHistory";

import BACKEND_URL_CONFIG from "@/lib/config";

const BACKEND_URL = BACKEND_URL_CONFIG;


export const NEPAL_REGIONS: Record<string, string[]> = {
  "Koshi Province": ["Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang", "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha", "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"],
  "Madhesh Province": ["Bara", "Dhanusha", "Mahottari", "Parsa", "Rautahat", "Saptari", "Sarlahi", "Siraha"],
  "Bagmati Province": ["Bhaktapur", "Chitwan", "Dhading", "Dolakha", "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur", "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"],
  "Gandaki Province": ["Baglung", "Gorkha", "Kaski", "Lamjung", "Manang", "Mustang", "Myagdi", "Nawalpur", "Parbat", "Syangja", "Tanahun"],
  "Lumbini Province": ["Arghakhanchi", "Banke", "Bardiya", "Dang", "Gulmi", "Kapilvastu", "Parasi", "Palpa", "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"],
  "Karnali Province": ["Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla", "Kalikot", "Mugu", "Salyan", "Surkhet", "Rukum West"],
  "Sudurpashchim Province": ["Achham", "Baitadi", "Bajhang", "Bajura", "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"],
};

export default function NotificationManagementPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetScope, setTargetScope] = useState<"all" | "targeted">("all");
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [severity, setSeverity] = useState<"critical" | "warning" | "info">("critical");
  const [category, setCategory] = useState("Disaster Alert");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imagePreview, setImagePreview] = useState<string>("");

  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/api/notifications`);
      const data = await res.json();
      if (data?.notifications) setNotifications(data.notifications);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const socket = io(BACKEND_URL);
    socket.on("emergency:notification", (newNotif: NotificationItem) => {
      setNotifications((prev) => [newNotif, ...prev]);
      showToast("📢 Emergency alert broadcasted successfully across network!", "success");
    });
    return () => { socket.disconnect(); };
  }, []);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch(`${BACKEND_URL}/api/notifications/upload`, { method: "POST", body: formData });
      const data = await res.json();
      if (data?.url) {
        setImageUrl(data.url);
        showToast("✓ Image uploaded to Cloudinary", "success");
      } else {
        showToast(data?.error || "Failed to upload image", "error");
      }
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      showToast("Cloudinary upload failed", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageUrl("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) { showToast("Please enter a title and message", "error"); return; }
    if (targetScope === "targeted" && !selectedProvince) { showToast("Please select a target province", "error"); return; }
    try {
      setSending(true);
      const payload = {
        title: title.trim(),
        message: message.trim(),
        targetScope,
        province: targetScope === "targeted" ? selectedProvince : undefined,
        district: targetScope === "targeted" && selectedDistrict ? selectedDistrict : undefined,
        severity,
        category,
        imageUrl: imageUrl || undefined,
      };
      const res = await fetch(`${BACKEND_URL}/api/notifications`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (res.ok && data?.success) {
        setTitle(""); setMessage(""); setTargetScope("all"); setSelectedProvince(""); setSelectedDistrict(""); setImageUrl(""); setImagePreview("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        showToast("🚀 Emergency Alert broadcasted to all matching devices!", "success");
      } else {
        showToast(data?.error || "Failed to send notification", "error");
      }
    } catch (err) {
      console.error("Broadcast failed:", err);
      showToast("Network error broadcasting alert", "error");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this notification record?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        showToast("Notification deleted", "success");
      }
    } catch (err) { console.error("Delete failed:", err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 lg:p-10">
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 shadow-2xl text-sm font-semibold transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${toastMessage.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
          {toastMessage.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-200">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">Emergency Alert & Notification Hub</h1>
              <p className="text-sm font-medium text-slate-500">Broadcast critical disaster warnings, weather alerts, and sector evacuation orders</p>
            </div>
          </div>
        </div>
        <button onClick={fetchNotifications} className="flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 md:self-auto">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-red-600" : ""}`} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <BroadcastComposer
            title={title} setTitle={setTitle} message={message} setMessage={setMessage} targetScope={targetScope} setTargetScope={setTargetScope}
            selectedProvince={selectedProvince} setSelectedProvince={setSelectedProvince} selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict}
            severity={severity} setSeverity={setSeverity} category={category} setCategory={setCategory} imageUrl={imageUrl} imagePreview={imagePreview}
            handleImageFileChange={handleImageFileChange} removeImage={removeImage} uploadingImage={uploadingImage} sending={sending} handleBroadcast={handleBroadcast} fileInputRef={fileInputRef}
          />
        </div>
        <BroadcastHistory notifications={notifications} loading={loading} fetchNotifications={fetchNotifications} handleDelete={handleDelete} />
      </div>
    </div>
  );
}
