import nodemailer from 'nodemailer';
import { connectDB } from '../config/database';
import crypto from 'crypto';
import { config } from '../config';

const SECRET = config.jwtSecret;

function generateInvestigationActionToken(investigationId: string, action: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`investigation:${investigationId}:${action}`)
    .digest('hex');
}

function verifyInvestigationActionToken(
  investigationId: string,
  action: string,
  token: string,
): boolean {
  const expected = generateInvestigationActionToken(investigationId, action);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(token, 'hex'),
    );
  } catch {
    return false;
  }
}

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

const PROVINCE_COORDS: Record<string, { lat: number; lng: number }> = {
  'Koshi Province':          { lat: 27.34, lng: 87.27 },
  'Madhesh Province':        { lat: 26.75, lng: 85.92 },
  'Bagmati Province':        { lat: 27.71, lng: 85.33 },
  'Gandaki Province':        { lat: 28.26, lng: 83.96 },
  'Lumbini Province':        { lat: 27.83, lng: 82.79 },
  'Karnali Province':        { lat: 29.18, lng: 82.17 },
  'Sudurpashchim Province':  { lat: 29.30, lng: 80.55 },
};

export interface NearestTeamForInvestigationResult {
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
}

export async function findNearestAvailableTeamForInvestigation(
  lat: number,
  lng: number
): Promise<NearestTeamForInvestigationResult | null> {
  const db = await connectDB();
  const col = db.collection('rescue_team_registrations');

  const teams = await col.find({
    status: 'approved',
    $or: [
      { availability: 'available' },
      { availability: { $exists: false } },
    ],
  }).toArray();

  if (teams.length === 0) return null;

  let nearest: NearestTeamForInvestigationResult | null = null;
  let minDist = Infinity;

  for (const t of teams) {
    const coords = PROVINCE_COORDS[t.province] || { lat: 27.75, lng: 86.65 };
    const dist = haversineKm(lat, lng, coords.lat, coords.lng);
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
        etaMinutes: Math.round((dist / 30) * 60),
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

function buildInvestigationEmailHtml(params: {
  investigationId: string;
  disasterName: string;
  lat: number;
  lng: number;
  location: string;
  team: NearestTeamForInvestigationResult;
  recipientName: string;
}): string {
  const backendUrl = process.env.BACKEND_PUBLIC_URL || `http://${process.env.SMTP_HOST ? '192.168.18.39' : 'localhost'}:4000`;
  function actionUrl(action: string) {
    const token = generateInvestigationActionToken(params.investigationId, action);
    return `${backendUrl}/api/investigations/action?investigationId=${encodeURIComponent(params.investigationId)}&action=${action}&token=${token}`;
  }

  const urlOkay            = actionUrl('okay');
  const urlCritical        = actionUrl('critical');
  const urlNeedMoreTeam    = actionUrl('need_more_team');
  const urlResolved        = actionUrl('resolved');
  const urlFalseAlarm      = actionUrl('false_alarm');

  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${params.lat},${params.lng}&travelmode=driving`;
  const appleMapsNavUrl  = `http://maps.apple.com/?daddr=${params.lat},${params.lng}&dirflg=d`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

        <tr>
          <td style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px;text-align:center">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;color:#fef3c7;text-transform:uppercase">
              🚨 AASHA EMERGENCY RESPONSE SYSTEM
            </p>
            <h1 style="margin:0;font-size:26px;font-weight:900;color:#ffffff;letter-spacing:-0.5px">
              INVESTIGATION DISPATCH
            </h1>
            <p style="margin:8px 0 0;font-size:14px;color:#fde68a;font-weight:600">
              Mission: ${params.investigationId}
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:24px 32px 0">
            <p style="margin:0;font-size:15px;color:#1e293b;font-weight:700">
              Dear ${params.recipientName},
            </p>
            <p style="margin:8px 0 0;font-size:14px;color:#64748b;line-height:1.6">
              Your rescue team <strong style="color:#1e293b">${params.team.teamName}</strong> has been
              selected to investigate the following disaster event. Please assess the situation and report your findings immediately.
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1.5px solid #fde68a;border-radius:12px;overflow:hidden">
              <tr>
                <td style="padding:16px 20px;border-bottom:1px solid #fde68a">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#92400e;text-transform:uppercase">
                    📋 DISASTER INVESTIGATION DETAILS
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 20px">
                  <table width="100%" cellpadding="4" cellspacing="0">
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280;width:140px">Investigation ID</td>
                      <td style="font-size:13px;font-weight:800;color:#1e293b">${params.investigationId}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Disaster</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.disasterName}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">Location</td>
                      <td style="font-size:13px;font-weight:700;color:#1e293b">${params.location}</td>
                    </tr>
                    <tr>
                      <td style="font-size:12px;font-weight:700;color:#6b7280">GPS Coordinates</td>
                      <td style="font-size:13px;font-weight:800;color:#d97706;font-family:monospace">
                        ${params.lat.toFixed(6)}°N, ${params.lng.toFixed(6)}°E
                      </td>
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

        <tr>
          <td style="padding:0 32px 20px;text-align:center">
            <p style="margin:0 0 12px;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d97706;text-transform:uppercase">🧭 Tap to start navigation</p>
            <a href="${googleMapsNavUrl}" target="_blank"
               style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;
                      letter-spacing:0.3px;box-shadow:0 4px 12px rgba(29,78,216,0.3);margin:4px">
              📍 Navigate with Google Maps →
            </a>
            <a href="${appleMapsNavUrl}" target="_blank"
               style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;
                      font-size:14px;font-weight:800;padding:14px 28px;border-radius:10px;
                      letter-spacing:0.3px;box-shadow:0 4px 12px rgba(15,23,42,0.3);margin:4px">
               Apple Maps →
            </a>
          </td>
        </tr>

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
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 24px">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:14px;overflow:hidden">
              <tr>
                <td style="padding:18px 24px;border-bottom:1px solid #1e293b">
                  <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:1.5px;color:#94a3b8;text-transform:uppercase">
                    📊 REPORT INVESTIGATION FINDINGS — tap a button to confirm
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlOkay}" target="_blank"
                           style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          ✅ All Okay
                        </a>
                      </td>
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlCritical}" target="_blank"
                           style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          🔴 Critical
                        </a>
                      </td>
                      <td style="padding:0 0 8px 0">
                        <a href="${urlNeedMoreTeam}" target="_blank"
                           style="display:inline-block;background:#f59e0b;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          ⚠️ Need More Team
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:0 6px 8px 0">
                        <a href="${urlResolved}" target="_blank"
                           style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;
                                  font-size:13px;font-weight:800;padding:11px 18px;border-radius:9px;
                                  letter-spacing:0.2px">
                          🚐 Mission Resolved
                        </a>
                      </td>
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
                    Each link is unique to this investigation and will update the command dashboard in real time.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:11px;color:#94a3b8;font-weight:600">
              Aasha Emergency Response System · Government of Nepal
            </p>
            <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">
              This is an automated investigation notification. Do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function createTransporter() {
  const rawPass = process.env.SMTP_PASS || '';
  const cleanPass = rawPass.replace(/\s+/g, '');

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: cleanPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
}

export interface InvestigationEmailParams {
  investigationId: string;
  disasterName: string;
  lat: number;
  lng: number;
  location: string;
  team: NearestTeamForInvestigationResult;
}

export async function sendInvestigationEmails(params: InvestigationEmailParams): Promise<{
  sent: string[];
  failed: string[];
}> {
  const transporter = createTransporter();
  const fromAddress = `"${process.env.DISPATCH_FROM_NAME || 'Aasha Rescue'}" <${process.env.SMTP_USER}>`;

  const recipients: Array<{ name: string; email: string }> = [
    { name: params.team.leadName, email: params.team.leadEmail },
    ...params.team.members
      .filter((m) => m.email && m.email !== '—')
      .map((m) => ({ name: m.name || 'Team Member', email: m.email })),
  ];

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
        subject: `🔍 INVESTIGATION ORDER: Disaster ${params.investigationId} — Immediate Assessment Required`,
        html: buildInvestigationEmailHtml({ ...params, recipientName: recipient.name }),
      });
      sent.push(recipient.email);
      console.log(`✅ Investigation email sent to ${recipient.email}`);
    } catch (err: any) {
      failed.push(recipient.email);
      console.error(`❌ Failed to email ${recipient.email}:`, err.message);
    }
  }

  return { sent, failed };
}

export {
  generateInvestigationActionToken,
  verifyInvestigationActionToken,
};
