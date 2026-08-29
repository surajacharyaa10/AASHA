"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dispatchRescueTeam = exports.getNearestTeam = void 0;
const database_1 = require("../config/database");
const dispatchService_1 = require("../services/dispatchService");
// ── GET /api/dispatch/nearest?lat=X&lng=Y ─────────────────────────────────
// Returns the nearest approved available rescue team for a given SOS location
const getNearestTeam = async (req, res) => {
    try {
        const lat = parseFloat(req.query.lat);
        const lng = parseFloat(req.query.lng);
        if (isNaN(lat) || isNaN(lng)) {
            return res.status(400).json({ error: 'lat and lng query params are required' });
        }
        const team = await (0, dispatchService_1.findNearestAvailableTeam)(lat, lng);
        if (!team) {
            return res.status(404).json({
                error: 'No available rescue teams found. All teams may be currently deployed.',
                hint: 'Check team availability in /rescue-team or approve new team registrations.',
            });
        }
        return res.json({ team });
    }
    catch (err) {
        console.error('getNearestTeam error:', err);
        return res.status(500).json({ error: 'Failed to find nearest team' });
    }
};
exports.getNearestTeam = getNearestTeam;
// ── POST /api/dispatch ────────────────────────────────────────────────────
// 1. Auto-selects nearest available team
// 2. Marks SOS event as assigned in MongoDB
// 3. Sends dispatch email to leader + all team members
const dispatchRescueTeam = async (req, res) => {
    try {
        const { sosId, lat, lng, place, callerNote, battery, meshHops, receivedTime, } = req.body;
        if (!sosId || lat === undefined || lng === undefined) {
            return res.status(400).json({ error: 'sosId, lat, lng are required' });
        }
        const sosLat = parseFloat(lat);
        const sosLng = parseFloat(lng);
        // 1. Find nearest available team
        const team = await (0, dispatchService_1.findNearestAvailableTeam)(sosLat, sosLng);
        if (!team) {
            return res.status(404).json({
                error: 'No available rescue teams found. All teams may be currently deployed.',
                hint: 'Check team status in /rescue-team. Teams currently on a mission cannot be re-dispatched.',
            });
        }
        const db = await (0, database_1.connectDB)();
        // 2. Update SOS event in DB — mark as assigned
        await db.collection('sos_events').updateOne({ packetId: sosId }, {
            $set: {
                status: 'assigned',
                assignedTeamId: team.id,
                assignedTeamName: team.teamName,
                assignedTeamLead: team.leadName,
                assignedTeamPhone: team.leadPhone,
                assignedAt: new Date(),
            },
        });
        // 2.5 Update the rescue team's status to deployed
        const { ObjectId } = require('mongodb');
        await db.collection('rescue_team_registrations').updateOne({ _id: new ObjectId(team.id) }, {
            $set: {
                availability: 'deployed',
                assignment: `Mission ${sosId}`,
                updatedAt: new Date(),
            },
        });
        // 3. Emit socket update to dashboard
        const io = req.app.get('io');
        if (io) {
            io.emit('sos:updated', {
                packetId: sosId,
                status: 'assigned',
                assignedTeamName: team.teamName,
            });
        }
        // 4. Send dispatch emails (non-blocking - report results but don't fail request)
        const emailResult = await (0, dispatchService_1.sendDispatchEmails)({
            sosId,
            sosLat,
            sosLng,
            sosPlace: place || `${sosLat.toFixed(4)}°N, ${sosLng.toFixed(4)}°E`,
            callerNote: callerNote || 'Emergency assistance required.',
            battery: battery ?? 100,
            meshHops: meshHops ?? 0,
            receivedTime: receivedTime || new Date().toLocaleTimeString('en-NP', { timeZone: 'Asia/Kathmandu' }),
            team,
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
    }
    catch (err) {
        console.error('dispatchRescueTeam error:', err);
        return res.status(500).json({ error: 'Dispatch failed', details: err.message });
    }
};
exports.dispatchRescueTeam = dispatchRescueTeam;
