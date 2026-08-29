import { Request, Response } from 'express';
import { connectDB } from '../config/database';
import {
  findNearestAvailableTeam,
  sendDispatchEmails,
  NearestTeamResult,
} from '../services/dispatchService';

// ── GET /api/dispatch/nearest?lat=X&lng=Y ─────────────────────────────────
// Returns the nearest approved available rescue team for a given SOS location
export const getNearestTeam = async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'lat and lng query params are required' });
    }

    const team = await findNearestAvailableTeam(lat, lng);

    if (!team) {
      return res.status(404).json({
        error: 'No available rescue teams found. All teams may be currently deployed.',
        hint: 'Check team availability in /rescue-team or approve new team registrations.',
      });
    }

    return res.json({ team });
  } catch (err: any) {
    console.error('getNearestTeam error:', err);
    return res.status(500).json({ error: 'Failed to find nearest team' });
  }
};

// ── POST /api/dispatch ────────────────────────────────────────────────────
// 1. Auto-selects nearest available team
// 2. Marks SOS event as assigned in MongoDB
// 3. Sends dispatch email to leader + all team members
export const dispatchRescueTeam = async (req: Request, res: Response) => {
  try {
    const {
      sosId,
      lat,
      lng,
      place,
      callerNote,
      battery,
      meshHops,
      receivedTime,
    } = req.body;

    if (!sosId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'sosId, lat, lng are required' });
    }

    const sosLat = parseFloat(lat);
    const sosLng = parseFloat(lng);

    // 1. Find nearest available team
    const team = await findNearestAvailableTeam(sosLat, sosLng);
    if (!team) {
      return res.status(404).json({
        error: 'No available rescue teams found. All teams may be currently deployed.',
        hint: 'Check team status in /rescue-team. Teams currently on a mission cannot be re-dispatched.',
      });
    }

    const db = await connectDB();

    // 2. Update SOS event in DB — mark as assigned
    await db.collection('sos_events').updateOne(
      { packetId: sosId },
      {
        $set: {
          status: 'assigned',
          assignedTeamId: team.id,
          assignedTeamName: team.teamName,
          assignedTeamLead: team.leadName,
          assignedTeamPhone: team.leadPhone,
          assignedAt: new Date(),
        },
      }
    );

    // 2.5 Update the rescue team's status to deployed
    const { ObjectId } = require('mongodb');
    await db.collection('rescue_team_registrations').updateOne(
      { _id: new ObjectId(team.id) },
      {
        $set: {
          availability: 'deployed',
          assignment: `Mission ${sosId}`,
          updatedAt: new Date(),
        },
      }
    );

    // 3. Emit socket update to dashboard
    const io = req.app.get('io');
    if (io) {
      io.emit('sos:updated', {
        packetId: sosId,
        status: 'assigned',
        assignedTeamName: team.teamName,
      });
    }

    // 4. Send dispatch emails — include victim profile from the SOS document
    const sosDoc = await db.collection('sos_events').findOne({ packetId: sosId });
    const emailResult = await sendDispatchEmails({
      sosId,
      sosLat,
      sosLng,
      sosPlace: place || `${sosLat.toFixed(4)}°N, ${sosLng.toFixed(4)}°E`,
      callerNote: callerNote || 'Emergency assistance required.',
      battery: battery ?? sosDoc?.battery ?? 100,
      meshHops: meshHops ?? sosDoc?.hopCount ?? 0,
      receivedTime: receivedTime || new Date().toLocaleTimeString('en-NP', { timeZone: 'Asia/Kathmandu' }),
      team,
      // Victim profile (may be null if the user hasn't filled their profile)
      victimName:       sosDoc?.name       ?? undefined,
      victimPhone:      sosDoc?.phone      ?? undefined,
      victimAddress:    sosDoc?.address    ?? undefined,
      victimBloodGroup: sosDoc?.bloodGroup ?? undefined,
      victimEmail:      sosDoc?.email      ?? undefined,
    });

    return res.json({
      success: true,
      message: `Rescue team dispatched. ${emailResult.sent.length} notification(s) sent.`,
      dispatchedTeam: {
        id: team.id,
        teamName: team.teamName,
        leadName: team.leadName,
        leadPhone: team.leadPhone,
        station: team.station,
        district: team.district,
        distanceKm: team.distanceKm,
        etaMinutes: team.etaMinutes,
        capabilities: team.capabilities,
      },
      emailsSent: emailResult.sent,
      emailsFailed: emailResult.failed,
    });
  } catch (err: any) {
    console.error('dispatchRescueTeam error:', err);
    return res.status(500).json({ error: 'Dispatch failed', details: err.message });
  }
};
