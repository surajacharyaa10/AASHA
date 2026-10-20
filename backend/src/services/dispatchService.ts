import nodemailer from 'nodemailer';
import { connectDB } from '../config/database';
import { generateActionToken } from '../lib/actionToken';


// ── Haversine distance in km ──────────────────────────────────────────────
function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Province centroid coordinates for geo-matching
const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Koshi Province':          { lat: 27.34, lng: 87.27 },
  'Madhesh Province':        { lat: 26.75, lng: 85.92 },
  'Bagmati Province':        { lat: 27.71, lng: 85.33 },
  'Gandaki Province':        { lat: 28.26, lng: 83.96 },
  'Lumbini Province':        { lat: 27.83, lng: 82.79 },
  'Karnali Province':        { lat: 29.18, lng: 82.17 },
  'Sudurpashchim Province':  { lat: 29.30, lng: 80.55 },
};

export interface NearestTeamResult {
  id: string;
  teamName: string;
  leadName: string;
  leadEmail: string;
  leadPhone: string;
  station: string;
  district: string;
  province: string;
  distanceKm: number;
  etaMinutes: number;
  capabilities: string[];
  members: Array<{ name: string; email: string; phone: string; role: string }>;
  leadCitizenshipDocUrl?: string;
}

// ── Find nearest available approved team from DB ──────────────────────────
export async function findNearestAvailableTeam(
  sosLat: number,
  sosLng: number
): Promise<NearestTeamResult | null> {
  const db = await connectDB();
  const col = db.collection('rescue_team_registrations');

  // Get all approved AND available teams (exclude deployed / off-duty)
  const teams = await col.find({
    status: 'approved',
    $or: [
      { availability: 'available' },
      { availability: { $exists: false } }, // teams registered before availability field was added
    ],
  }).toArray();
  if (teams.length === 0) return null;

  let nearest: NearestTeamResult | null = null;
  let minDist = Infinity;

  for (const t of teams) {
    const coords = PROVINCE_COORDS[t.province] || { lat: 27.75, lng: 86.65 };
    const dist = haversineKm(sosLat, sosLng, coords.lat, coords.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = {
        id: t._id.toString(),
        teamName: t.teamName,
        leadName: t.leadName,
        leadEmail: t.leadEmail,
        leadPhone: t.leadPhone,
        station: t.station,
        district: t.district,
        province: t.province,
        distanceKm: Math.round(dist * 10) / 10,
        etaMinutes: Math.round((dist / 30) * 60), // ~30 km/h average
        capabilities: t.capabilities || [],
        members: (t.members || []).map((m: any) => ({
          name: m.name || '',
          email: m.email || '',
          phone: m.phone || '',
          role: m.role || 'Field Responder',
        })),
      };
    }
  }

  return nearest;
}

// ── Build the mission briefing HTML email ────────────────────────────────
function buildDispatchEmailHtml(params: {
  sosId: string;
  sosLat: number;
  sosLng: number;
  sosPlace: string;
  callerNote: string;
  battery: number;
  meshHops: number;
  receivedTime: string;
  team: NearestTeamResult;
  recipientName: string;
  // Victim profile (from mobile SOS payload)
  victimName?: string;
  victimPhone?: string;
  victimAddress?: string;
  victimBloodGroup?: string;
  victimEmail?: string;
}): string {
  // Navigation URLs — open turn-by-turn directions immediately on both Android & iOS
  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${params.sosLat},${params.sosLng}&travelmode=driving`;
  const appleMapsNavUrl  = `http://maps.apple.com/?daddr=${params.sosLat},${params.sosLng}&dirflg=d`;
  // Plain pin URL for desktop clients
  const googleMapsPinUrl = `https://www.google.com/maps?q=${params.sosLat},${params.sosLng}`;
  // Signed one-click action URLs embedded in the email
  const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://${process.env.SMTP_HOST ? '192.168.18.39' : 'localhost'}:4000`;
  function actionUrl(action: string) {
    const token = generateActionToken(params.sosId, action);
    return `${backendUrl}/api/sos/action?packetId=${encodeURIComponent(params.sosId)}&action=${action}&token=${token}`;
  }
  const urlResolved   = actionUrl('resolved');
  const urlEnRoute    = actionUrl('en_route');
  const urlOnScene    = actionUrl('on_scene');
  const urlFalseAlarm = actionUrl('false_alarm');

  const capList = (params.team.capabilities && params.team.capabilities.length > 0)
    ? params.team.capabilities.map((c: string) => `<li>${c}</li>`).join('')
    : '<li style="color:#9ca3af;font-style:italic">None specified</li>';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <!-- RED HEADER BANNER -->
        <tr>
          <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);padding:28px 32px;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#fca5a5;text-transform:uppercase">
              🚨 AASHA EMERGENCY RESPONSE SYSTEM
            </p>
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">
              RESCUE DISPATCH ORDER
            </h1>
            <p style="margin:8px 0 0;font-size:14px;color:#fecaca;font-weight:600">
              Mission: ${params.sosId}
            </p>
          </td>
        </tr>

        <!-- GREETING -->
        <tr>
          <td style="padding:24px 32px 0">
            <p style="margin:0;font-size:15px;color:#1e293b;font-weight:700">
              Dear ${params.recipientName},
            </p>
            <p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.6">
              Your rescue team <strong style="color:#1e293b">${params.team.teamName}</strong> has been
              automatically selected as the nearest available response unit and
              <strong style="color:#dc2626">dispatched to the following SOS emergency</strong>.
              Please mobilize immediately.
            </p>
          </td>
        </tr>

        <!-- SOS INCIDENT DETAILS -->
        <tr>
          <td style="padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;overflow:hidden">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #fecaca">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#dc2626;text-transform:uppercase">
                    📍 SOS INCIDENT DETAILS
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280;width:140px">Incident ID</td>
                      <td style="font-size:13px;font-weight:800;color:#1e293b">${params.sosId}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Location</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.sosPlace}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">GPS Coordinates</td>
                      <td style="font-size:13px;font-weight:800;color:#dc2626;font-family:monospace">
                        ${params.sosLat.toFixed(6)}°N, ${params.sosLng.toFixed(6)}°E
                      </td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Beacon Battery</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.battery}%</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Mesh Hops</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.meshHops} relay hops</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Received At</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.receivedTime} NPT</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Est. Distance</td>
                      <td style="font-size:13px;font-weight:700;color:#059669">${params.team.distanceKm} km · ~${params.team.etaMinutes} min ETA</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

         <!-- DISTRESS TRANSMISSION NOTE -->
         ${params.callerNote && params.callerNote.trim().length > 0 ? `
         <tr>
           <td style="padding:0 32px 20px">
             <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px">
               <tr>
                 <td style="padding:14px 20px">
                   <p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#92400e;text-transform:uppercase">
                     📢 DISTRESS TRANSMISSION NOTE
                   </p>
                   <p style="margin:0;font-size:13px;color:#78350f;font-style:italic;line-height:1.6">
                     "${params.callerNote}"
                   </p>
                 </td>
               </tr>
             </table>
           </td>
         </tr>` : ''}

        <!-- OPEN IN MAPS / NAVIGATION BUTTONS -->
        <tr>
          <td style="padding:0 32px 20px;text-align:center">
            <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#dc2626;text-transform:uppercase">🧭 Tap to start navigation</p>
            <!-- Google Maps Navigation -->
            <a href="${googleMapsNavUrl}" target="_blank"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;
                      letter-spacing:0.3px;box-shadow:0 4px 12px rgba(29,78,216,0.3);margin:4px">
              📍 Navigate with Google Maps →
            </a>
            <!-- Apple Maps Navigation (iPhone) -->
            <a href="${appleMapsNavUrl}" target="_blank"
               style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;
                      letter-spacing:0.3px;box-shadow:0 4px 12px rgba(15,23,42,0.3);margin:4px">
               Apple Maps →
            </a>
            <p style="margin:10px 0 0;font-size:11px;color:#94a3b8">
              Coordinates: ${params.sosLat.toFixed(6)}°N, ${params.sosLng.toFixed(6)}°E
              · <a href="${googleMapsPinUrl}" target="_blank" style="color:#3b82f6">View pin</a>
            </p>
          </td>
        </tr>

        <!-- VICTIM PROFILE -->
        ${(params.victimName || params.victimPhone || params.victimBloodGroup || params.victimAddress) ? `
        <tr>
          <td style="padding:0 32px 20px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf4ff;border:1.5px solid #e9d5ff;border-radius:12px">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #e9d5ff">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#7e22ce;text-transform:uppercase">
                    🩺 VICTIM PROFILE (from SOS beacon)
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    ${params.victimName ? `<tr><td style="font-size:12px;font-weight:700;color:#6b7280;width:140px">Full Name</td><td style="font-size:13px;font-weight:800;color:#1e293b">${params.victimName}</td></tr>` : ''}
                    ${params.victimPhone ? `<tr><td style="font-size:12px;font-weight:700;color:#6b7280">Phone</td><td style="font-size:13px;font-weight:700;color:#1e293b">${params.victimPhone}</td></tr>` : ''}
                    ${params.victimEmail ? `<tr><td style="font-size:12px;font-weight:700;color:#6b7280">Email</td><td style="font-size:13px;font-weight:700;color:#1e293b">${params.victimEmail}</td></tr>` : ''}
                    ${params.victimAddress ? `<tr><td style="font-size:12px;font-weight:700;color:#6b7280">Address</td><td style="font-size:13px;font-weight:700;color:#1e293b">${params.victimAddress}</td></tr>` : ''}
                    ${params.victimBloodGroup ? `<tr><td style="font-size:12px;font-weight:700;color:#6b7280">Blood Group</td><td style="font-size:14px;font-weight:900;color:#dc2626">${params.victimBloodGroup}</td></tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}

        <!-- TEAM INFO -->
        <tr>
          <td style="padding:0 32px 20px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:12px">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #bbf7d0">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#15803d;text-transform:uppercase">
                    🛡️ DISPATCHED TEAM DETAILS
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280;width:140px">Team</td>
                      <td style="font-size:13px;font-weight:800;color:#1e293b">${params.team.teamName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Commander</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.team.leadName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Base Station</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.team.station}, ${params.team.district}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280;vertical-align:top">Capabilities</td>
                      <td style="font-size:12px;color:#374151">
                        <ul style="margin:2px 0;padding-left:16px">${capList}</ul>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            
            </table>
          </td>
        </tr>

        <!-- ── STATUS UPDATE ACTIONS ── -->
        <tr>
          <td style="padding:0 32px 24px">
            <table width="100%" cellpadding="0" cellspacing="0"
                   style="background:#0f172a;border-radius:14px;overflow:hidden">
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #1e293b">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;
                             color:#94a3b8;text-transform:uppercase">
                    📋 Update Mission Status — tap a button to confirm
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- ✅ Resolved -->
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlResolved}" target="_blank"
                           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          ✅ Mission Resolved
                        </a>
                      </td>
                      <!-- 🚐 En Route -->
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlEnRoute}" target="_blank"
                           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          🚐 Team En Route
                        </a>
                      </td>
                      <!-- 📍 On Scene -->
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlOnScene}" target="_blank"
                           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          📍 On Scene
                        </a>
                      </td>
                      <!-- ⚠️ False Alarm -->
                      <td style="padding:0 0 8px 0">
                        <a href="${urlFalseAlarm}" target="_blank"
                           style="display:inline-block;background:#92400e;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          ⚠️ False Alarm
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:10px 0 0;font-size:11px;color:#64748b;line-height:1.5">
                    Each link is unique to this dispatch order and will update the
                    command dashboard in real time. Links remain valid until the
                    mission is closed.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600">
              Aasha Emergency Response System · Government of Nepal
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">
              This is an automated dispatch notification. Do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Create Nodemailer transporter ─────────────────────────────────────────
function createTransporter() {
  // Gmail App Passwords are displayed with spaces (e.g. "abcd efgh ijkl mnop")
  // but must be passed WITHOUT spaces to nodemailer.
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,           // STARTTLS on port 587
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false, // allow self-signed in dev
    },
  });
}

export interface DispatchEmailParams {
  sosId: string;
  sosLat: number;
  sosLng: number;
  sosPlace: string;
  callerNote: string;
  battery: number;
  meshHops: number;
  receivedTime: string;
  team: NearestTeamResult;
  // Victim profile fields (optional — sent from mobile SOS payload)
  victimName?: string;
  victimPhone?: string;
  victimAddress?: string;
  victimBloodGroup?: string;
  victimEmail?: string;
}

// ── Send dispatch email to leader + all team members ─────────────────────
export async function sendDispatchEmails(params: DispatchEmailParams): Promise<{
  sent: string[];
  failed: string[];
}> {
  const transporter = createTransporter();
  const fromAddress = `"${process.env.DISPATCH_FROM_NAME || 'Aasha Rescue'}" <${process.env.SMTP_USER}>`;

  // Build full recipient list: leader + all members with emails
  const recipients: Array<{ name: string; email: string }> = [
    { name: params.team.leadName, email: params.team.leadEmail },
    ...params.team.members
      .filter((m) => m.email && m.email !== '—')
      .map((m) => ({ name: m.name || 'Team Member', email: m.email })),
  ];

  // Deduplicate by email
  const unique = Array.from(
    new Map(recipients.map((r) => [r.email.toLowerCase(), r])).values()
  );

  const sent: string[] = [];
  const failed: string[] = [];

  for (const recipient of unique) {
    try {
      await transporter.sendMail({
        from: fromAddress,
        to: recipient.email,
        subject: `🚨 DISPATCH ORDER: SOS ${params.sosId} — Immediate Response Required`,
        html: buildDispatchEmailHtml({ ...params, recipientName: recipient.name }),
      });
      sent.push(recipient.email);
      console.log(`✅ Dispatch email sent to ${recipient.email}`);
    } catch (err: any) {
      failed.push(recipient.email);
      console.error(`❌ Failed to email ${recipient.email}:`, err.message);
    }
  }

  return { sent, failed };
}
