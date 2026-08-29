import { Request, Response } from 'express';
import { connectDB } from '../config/database';
import { ObjectId } from 'mongodb';
import { verifyActionToken } from '../lib/actionToken';

// Valid actions a rescue team member can take from the email link
const VALID_ACTIONS: Record<string, { label: string; status: string; color: string; emoji: string }> = {
  resolved:    { label: 'Mission Resolved',     status: 'resolved',    color: '#16a34a', emoji: '✅' },
  false_alarm: { label: 'False Alarm',           status: 'false_alarm', color: '#d97706', emoji: '⚠️' },
  en_route:    { label: 'Team En Route',          status: 'en_route',    color: '#2563eb', emoji: '🚐' },
  on_scene:    { label: 'Team On Scene',          status: 'on_scene',    color: '#7c3aed', emoji: '📍' },
};

// Simple HTML response page returned when a rescue member clicks an email link
function buildResultPage(opts: {
  success: boolean;
  packetId: string;
  actionLabel: string;
  color: string;
  emoji: string;
  message: string;
  dashboardUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aasha — Mission Status Update</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f1f5f9;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 40px 36px;
      max-width: 480px;
      width: 100%;
      box-shadow: 0 8px 40px rgba(0,0,0,0.10);
      text-align: center;
    }
    .icon { font-size: 56px; margin-bottom: 18px; }
    .badge {
      display: inline-block;
      background: ${opts.color}18;
      color: ${opts.color};
      border: 1.5px solid ${opts.color}40;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      padding: 5px 14px;
      margin-bottom: 16px;
    }
    h1 { font-size: 22px; font-weight: 900; color: #0f172a; margin-bottom: 10px; }
    .meta { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 8px; }
    .packet { font-size: 11px; font-weight: 700; color: #94a3b8; letter-spacing: 0.5px; margin-bottom: 28px; }
    .btn {
      display: inline-block;
      background: #0f172a;
      color: #fff;
      text-decoration: none;
      font-size: 13px;
      font-weight: 800;
      padding: 12px 28px;
      border-radius: 10px;
      letter-spacing: 0.3px;
    }
    .divider { border: none; border-top: 1px solid #e2e8f0; margin: 28px 0; }
    .footer { font-size: 11px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${opts.emoji}</div>
    <div class="badge">Aasha Emergency Response</div>
    <h1>${opts.actionLabel}</h1>
    <p class="meta">${opts.message}</p>
    <p class="packet">Incident ID: ${opts.packetId}</p>
    <a href="${opts.dashboardUrl}" class="btn">Open Dashboard →</a>
    <hr class="divider">
    <p class="footer">
      This action was recorded and the command dashboard has been updated in real time.<br>
      If this was a mistake, please update the status from the dashboard directly.
    </p>
  </div>
</body>
</html>`;
}

function buildErrorPage(message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aasha — Invalid Link</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, sans-serif; background: #f1f5f9; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: #fff; border-radius: 20px; padding: 40px 36px; max-width: 420px; width: 100%; box-shadow: 0 8px 40px rgba(0,0,0,0.10); text-align: center; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
    p { font-size: 13px; color: #64748b; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🔗</div>
    <h1>Invalid or Expired Link</h1>
    <p>${message}<br><br>Please use the dashboard directly or contact the command center.</p>
  </div>
</body>
</html>`;
}

/**
 * GET /api/sos/action?packetId=...&action=resolved&token=...
 *
 * One-click action link for rescue team members from the dispatch email.
 * Uses HMAC token to authenticate the request without requiring a login.
 */
export const handleEmailAction = async (req: Request, res: Response) => {
  const { packetId, action, token } = req.query as Record<string, string>;

  // 1. Validate inputs
  if (!packetId || !action || !token) {
    return res.status(400).send(buildErrorPage('Missing required parameters (packetId, action, token).'));
  }

  const actionDef = VALID_ACTIONS[action];
  if (!actionDef) {
    return res.status(400).send(buildErrorPage(`Unknown action "${action}".`));
  }

  // 2. Verify HMAC token
  if (!verifyActionToken(packetId, action, token)) {
    return res.status(403).send(buildErrorPage('This link is invalid or has been tampered with.'));
  }

  // 3. Find and update the SOS event
  try {
    const db = await connectDB();
    const col = db.collection('sos_events');

    const query = ObjectId.isValid(packetId)
      ? { _id: new ObjectId(packetId) }
      : { packetId };

    const event = await col.findOne(query);
    if (!event) {
      return res.status(404).send(buildErrorPage(`SOS event "${packetId}" was not found in the database.`));
    }

    const resolvedAt = ['resolved', 'false_alarm'].includes(action) ? new Date() : null;

    await col.updateOne(query, {
      $set: {
        status: actionDef.status,
        ...(resolvedAt ? { resolvedAt } : {}),
        emailActionAt: new Date(),
        emailAction: action,
      },
    });

    // If mission resolved/false alarm → free the team back to available
    if (resolvedAt && event.assignedTeamId) {
      try {
        await db.collection('rescue_team_registrations').updateOne(
          { _id: new ObjectId(event.assignedTeamId) },
          { $set: { availability: 'available', assignment: null, updatedAt: new Date() } },
        );
      } catch { /* non-critical */ }
    }

    // 4. Push real-time socket update to the dashboard
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('sos:updated', {
        packetId: event.packetId,
        status: actionDef.status,
        resolvedAt: resolvedAt?.toISOString() ?? null,
        emailAction: action,
      });
    }

    const dashboardUrl = process.env.DASHBOARD_ORIGIN
      ? `${process.env.DASHBOARD_ORIGIN}/dashboard`
      : 'http://localhost:3000/dashboard';

    return res.send(
      buildResultPage({
        success: true,
        packetId: event.packetId,
        actionLabel: actionDef.label,
        color: actionDef.color,
        emoji: actionDef.emoji,
        message: `The status of this SOS incident has been updated to "<strong>${actionDef.label}</strong>" and the command center has been notified in real time.`,
        dashboardUrl,
      }),
    );
  } catch (err: any) {
    console.error('[emailAction] error:', err);
    return res.status(500).send(buildErrorPage('A server error occurred. Please try again or use the dashboard.'));
  }
};
