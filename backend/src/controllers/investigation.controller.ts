import { Request, Response } from 'express';
import { connectDB } from '../config/database';
import { ObjectId } from 'mongodb';
import {
  findNearestAvailableTeamForInvestigation,
  sendInvestigationEmails,
  verifyInvestigationActionToken,
  NearestTeamForInvestigationResult,
} from '../services/investigationService';

// GET /api/investigations/nearest-team?lat=X&lng=Y
export const getNearestTeamForInvestigation = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }

    const team = await findNearestAvailableTeamForInvestigation(lat, lng);

    if (!team) {
      return res.status(404).json({
        error: 'No available rescue teams found. All teams may be currently deployed.',
        hint: 'Check team availability in /rescue-team or approve new team registrations.',
      });
    }

    return res.json({ team });
  } catch (err: any) {
    console.error('getNearestTeamForInvestigation error:', err);
    return res.status(500).json({ error: 'Failed to find nearest team' });
  }
};

// POST /api/investigations
export const createInvestigation = async (req: Request, res: Response) => {
  try {
    const {
      disasterEventId,
      disasterName,
      lat,
      lng,
      location,
    } = req.body;

    if (!disasterEventId || !disasterName || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'disasterEventId, disasterName, lat, lng are required' });
    }

    const db = await connectDB();
    const investigationsCollection = db.collection('investigations');

    const newInvestigation = {
      disasterEventId,
      disasterName,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      location: location || `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
      status: 'pending',
      assessment: null,
      assignedTeamId: null,
      assignedTeamName: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await investigationsCollection.insertOne(newInvestigation);
    const saved = {
      id: result.insertedId.toString(),
      ...newInvestigation,
    };

    return res.status(201).json(saved);
  } catch (err: any) {
    console.error('createInvestigation error:', err);
    return res.status(500).json({ error: 'Failed to create investigation' });
  }
};

// GET /api/investigations
export const getInvestigations = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const investigationsCollection = db.collection('investigations');

    const investigations = await investigationsCollection
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.json({
      investigations: investigations.map((inv) => ({
        id: inv._id.toString(),
        disasterEventId: inv.disasterEventId,
        disasterName: inv.disasterName,
        lat: inv.lat,
        lng: inv.lng,
        location: inv.location,
        status: inv.status,
        assessment: inv.assessment,
        assignedTeamId: inv.assignedTeamId,
        assignedTeamName: inv.assignedTeamName,
        createdAt: inv.createdAt,
        updatedAt: inv.updatedAt,
      })),
    });
  } catch (err: any) {
    console.error('getInvestigations error:', err);
    return res.status(500).json({ error: 'Failed to fetch investigations' });
  }
};

// GET /api/investigations/:id
export const getInvestigation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    const investigationsCollection = db.collection('investigations');

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { disasterEventId: id };
    }

    const investigation = await investigationsCollection.findOne(query);
    if (!investigation) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    return res.json({
      id: investigation._id.toString(),
      disasterEventId: investigation.disasterEventId,
      disasterName: investigation.disasterName,
      lat: investigation.lat,
      lng: investigation.lng,
      location: investigation.location,
      status: investigation.status,
      assessment: investigation.assessment,
      assignedTeamId: investigation.assignedTeamId,
      assignedTeamName: investigation.assignedTeamName,
      createdAt: investigation.createdAt,
      updatedAt: investigation.updatedAt,
    });
  } catch (err: any) {
    console.error('getInvestigation error:', err);
    return res.status(500).json({ error: 'Failed to fetch investigation' });
  }
};

// POST /api/investigations/:id/assign
export const assignTeamToInvestigation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await connectDB();
    const investigationsCollection = db.collection('investigations');
    const rescueTeamRegistrationsCollection = db.collection('rescue_team_registrations');

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { disasterEventId: id };
    }

    const investigation = await investigationsCollection.findOne(query);
    if (!investigation) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    if (investigation.assignedTeamId) {
      return res.status(400).json({ error: 'Investigation already assigned to a team' });
    }

    const team = await findNearestAvailableTeamForInvestigation(investigation.lat, investigation.lng);
    if (!team) {
      return res.status(404).json({
        error: 'No available rescue teams found. All teams may be currently deployed.',
      });
    }

    const updatedInvestigation = await investigationsCollection.findOneAndUpdate(
      query,
      {
        $set: {
          status: 'investigating',
          assignedTeamId: team.id,
          assignedTeamName: team.teamName,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    const resultInv = updatedInvestigation && ('value' in updatedInvestigation ? updatedInvestigation.value : updatedInvestigation);
    if (!resultInv) {
      return res.status(404).json({ error: 'Investigation not found or failed to update' });
    }

    await rescueTeamRegistrationsCollection.updateOne(
      { _id: new ObjectId(team.id) },
      {
        $set: {
          availability: 'deployed',
          assignment: `Investigation ${resultInv._id.toString()}`,
          updatedAt: new Date(),
        },
      }
    );

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('investigation:updated', {
        id: resultInv._id.toString(),
        status: 'investigating',
        assignedTeamId: team.id,
        assignedTeamName: team.teamName,
      });
    }

    const emailResult = await sendInvestigationEmails({
      investigationId: resultInv._id.toString(),
      disasterName: resultInv.disasterName,
      lat: resultInv.lat,
      lng: resultInv.lng,
      location: resultInv.location,
      team,
    });

    return res.json({
      success: true,
      message: `Investigation team dispatched. ${emailResult.sent.length} notification(s) sent.`,
      investigation: {
        id: resultInv._id.toString(),
        status: 'investigating',
        assignedTeamId: team.id,
        assignedTeamName: team.teamName,
      },
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed,
    });
  } catch (err: any) {
    console.error('assignTeamToInvestigation error:', err);
    return res.status(500).json({ error: 'Failed to assign team', details: err.message });
  }
};

// PATCH /api/investigations/:id/status
export const updateInvestigationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, assessment } = req.body;

    const db = await connectDB();
    const investigationsCollection = db.collection('investigations');

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { disasterEventId: id };
    }

    const updateData: any = {
      status: status || 'pending',
      updatedAt: new Date(),
    };
    if (assessment !== undefined) {
      updateData.assessment = assessment;
    }

    const updatedInvestigation = await investigationsCollection.findOneAndUpdate(
      query,
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const resultInv = updatedInvestigation && ('value' in updatedInvestigation ? updatedInvestigation.value : updatedInvestigation);
    if (!resultInv) {
      return res.status(404).json({ error: 'Investigation not found' });
    }

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('investigation:updated', {
        id: resultInv._id.toString(),
        status: resultInv.status,
        assessment: resultInv.assessment,
      });
    }

    return res.json({
      id: resultInv._id.toString(),
      status: resultInv.status,
      assessment: resultInv.assessment,
    });
  } catch (err: any) {
    console.error('updateInvestigationStatus error:', err);
    return res.status(500).json({ error: 'Failed to update investigation status' });
  }
};

// GET /api/investigations/action?investigationId=...&action=...&token=...
export const handleInvestigationEmailAction = async (req: Request, res: Response) => {
  const { investigationId, action, token } = req.query as Record<string, string>;

  if (!investigationId || !action || !token) {
    return res.status(400).send(buildErrorPage('Missing required parameters (investigationId, action, token).'));
  }

  const VALID_ACTIONS: Record<string, { label: string; status: string; color: string; emoji: string }> = {
    okay:            { label: 'All Okay',            status: 'investigating', color: '#16a34a', emoji: '✅' },
    critical:        { label: 'Critical Situation',  status: 'investigating', color: '#dc2626', emoji: '🔴' },
    need_more_team:  { label: 'Need More Team',      status: 'investigating', color: '#f59e0b', emoji: '⚠️' },
    resolved:        { label: 'Mission Resolved',    status: 'resolved',      color: '#2563eb', emoji: '🚐' },
    false_alarm:     { label: 'False Alarm',         status: 'false_alarm',   color: '#92400e', emoji: '⚠️' },
  };

  const actionDef = VALID_ACTIONS[action];
  if (!actionDef) {
    return res.status(400).send(buildErrorPage(`Unknown action "${action}".`));
  }

  if (!verifyInvestigationActionToken(investigationId, action, token)) {
    return res.status(403).send(buildErrorPage('This link is invalid or has been tampered with.'));
  }

  try {
    const db = await connectDB();
    const col = db.collection('investigations');

    let query = {};
    if (ObjectId.isValid(investigationId)) {
      query = { _id: new ObjectId(investigationId) };
    } else {
      query = { disasterEventId: investigationId };
    }

    const investigation = await col.findOne(query);
    if (!investigation) {
      return res.status(404).send(buildErrorPage(`Investigation "${investigationId}" was not found in the database.`));
    }

    const updateData: any = {
      status: actionDef.status,
      emailActionAt: new Date(),
      emailAction: action,
    };

    if (action === 'okay' || action === 'critical' || action === 'need_more_team') {
      updateData.assessment = action;
    }

    await col.updateOne(query, { $set: updateData });

    // Free the team when the investigation is concluded — resolved, false alarm, okay, or critical
    if ((action === 'resolved' || action === 'false_alarm' || action === 'okay' || action === 'critical') && investigation.assignedTeamId) {
      try {
        const teamIdStr = typeof investigation.assignedTeamId === 'string'
          ? investigation.assignedTeamId
          : investigation.assignedTeamId.toString();

        if (!ObjectId.isValid(teamIdStr)) {
          console.error('[investigationEmailAction] Invalid assignedTeamId:', teamIdStr);
        } else {
          const teamObjectId = new ObjectId(teamIdStr);

          const updateResult = await db.collection('rescue_team_registrations').updateOne(
            { _id: teamObjectId },
            { $set: { availability: 'available', assignment: null, updatedAt: new Date() } }
          );

          if (updateResult.matchedCount === 0) {
            console.error('[investigationEmailAction] No team found with _id:', teamIdStr);
          } else {
            console.log(`[investigationEmailAction] Freed team ${teamIdStr} back to available`);
          }

          // Also update rescue_teams collection if it exists
          const rescueTeamsUpdateResult = await db.collection('rescue_teams').updateOne(
            { registrationId: teamIdStr },
            { $set: { availability: 'available', assignment: null, updatedAt: new Date() } }
          );

          if (rescueTeamsUpdateResult.matchedCount > 0) {
            console.log(`[investigationEmailAction] Also freed rescue_teams entry for registrationId ${teamIdStr}`);
          }
        }
      } catch (err) {
        console.error('[investigationEmailAction] Failed to free team:', err);
      }
    }

    const io = (req.app as any).get('io');
    if (io) {
      io.emit('investigation:updated', {
        id: investigation._id.toString(),
        status: actionDef.status,
        assessment: action === 'okay' || action === 'critical' || action === 'need_more_team' ? action : undefined,
        emailAction: action,
      });
    }

    const dashboardUrl = process.env.DASHBOARD_ORIGIN
      ? `${process.env.DASHBOARD_ORIGIN}/dashboard`
      : 'http://localhost:3000/dashboard';

    return res.send(
      buildResultPage({
        success: true,
        investigationId: investigation._id.toString(),
        actionLabel: actionDef.label,
        color: actionDef.color,
        emoji: actionDef.emoji,
        message: `The status of this investigation has been updated to "<strong>${actionDef.label}</strong>" and the command dashboard has been notified in real time.`,
        dashboardUrl,
      }),
    );
  } catch (err: any) {
    console.error('[investigationEmailAction] error:', err);
    return res.status(500).send(buildErrorPage('A server error occurred. Please try again or use the dashboard.'));
  }
};

function buildResultPage(opts: {
  success: boolean;
  investigationId: string;
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
  <title>Aasha — Investigation Status Update</title>
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
    <p class="packet">Investigation ID: ${opts.investigationId}</p>
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
