export interface TeamMemberInput {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  citizenshipNumber: string;
  citizenshipDocUrl?: string;
  uploadingDoc?: boolean;
}

export interface RegistrationRecord {
  id: string;
  teamName: string;
  station: string;
  district: string;
  province: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  leadCitizenshipNumber: string;
  leadCitizenshipDocUrl?: string;
  teamLetterDocUrl?: string;
  capabilities: string[];
  membersCount: number;
  members: TeamMemberInput[];
  status: "pending_verification" | "approved" | "rejected";
  verificationNotes?: string;
  createdAt: string;
}

export const RESCUE_CAPABILITIES = [
  "High Altitude Mountaineering",
  "Rope & Cliff Rescue",
  "Avalanche Search & Probe",
  "Swiftwater & Flood Rescue",
  "Trauma & Emergency First Aid",
  "Helicopter Winch Operations",
  "Canine Search & Tracking",
  "Communication & BLE Relay",
];

export const BACKEND_URL = "http://localhost:4000";
