import { Request, Response } from 'express';
import { connectDB } from '../config/database';

// GET /api/analytics/summary
export const getAnalyticsSummary = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const sosCol = db.collection('sos_events');
    const teamCol = db.collection('rescue_team_registrations');

    const [totalSos, pendingSos, assignedSos, resolvedSos] = await Promise.all([
      sosCol.countDocuments({}),
      sosCol.countDocuments({ status: 'pending' }),
      sosCol.countDocuments({ status: 'assigned' }),
      sosCol.countDocuments({ status: 'resolved' }),
    ]);

    const [totalTeams, approvedTeams, availableTeams, deployedTeams] = await Promise.all([
      teamCol.countDocuments({}),
      teamCol.countDocuments({ status: 'approved' }),
      teamCol.countDocuments({ status: 'approved', $or: [{ availability: 'available' }, { availability: { $exists: false } }] }),
      teamCol.countDocuments({ status: 'approved', availability: 'deployed' }),
    ]);

    // Hourly breakdown (last 24h, 3-hour slots)
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const hourlyEvents = await sosCol.aggregate([
      { $match: { reportedAt: { $gte: oneDayAgo } } },
      {
        $group: {
          _id: { $floor: { $divide: [{ $hour: { date: '$reportedAt', timezone: 'Asia/Kathmandu' } }, 3] } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const hourlyMap: Record<number, { total: number; resolved: number }> = {};
    for (const e of hourlyEvents) { hourlyMap[e._id] = { total: e.total, resolved: e.resolved }; }
    const hourly24h = Array.from({ length: 8 }, (_, i) => ({
      label: `${String(i * 3).padStart(2, '0')}:00`,
      total: hourlyMap[i]?.total || 0,
      resolved: hourlyMap[i]?.resolved || 0,
    }));

    // Daily breakdown (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyEvents = await sosCol.aggregate([
      { $match: { reportedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dayOfWeek: { date: '$reportedAt', timezone: 'Asia/Kathmandu' } },
          total: { $sum: 1 },
          resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]).toArray();

    const dailyMap: Record<number, { total: number; resolved: number }> = {};
    for (const e of dailyEvents) { dailyMap[e._id] = { total: e.total, resolved: e.resolved }; }
    const weekly7d = [2, 3, 4, 5, 6, 7, 1].map((dow) => ({
      label: dayNames[dow === 1 ? 0 : dow - 1],
      total: dailyMap[dow]?.total || 0,
      resolved: dailyMap[dow]?.resolved || 0,
    }));

    const recentEvents = await sosCol.find({}).sort({ reportedAt: -1 }).limit(10).toArray();
    const teamList = await teamCol.find({ status: 'approved' }).sort({ teamName: 1 }).toArray();

    return res.json({
      summary: {
        totalSos, pendingSos, assignedSos, resolvedSos,
        totalTeams, approvedTeams, availableTeams, deployedTeams,
        successRate: totalSos > 0 ? ((resolvedSos / totalSos) * 100).toFixed(1) : '0.0',
      },
      hourly24h,
      weekly7d,
      recentEvents: recentEvents.map((e) => ({
        id: e.packetId || e._id.toString(),
        status: e.status,
        lat: e.latitude,
        lng: e.longitude,
        battery: e.battery,
        hops: e.hopCount,
        reportedAt: e.reportedAt,
        assignedTeamName: e.assignedTeamName || null,
      })),
      teams: teamList.map((t) => ({
        id: t._id.toString(),
        teamName: t.teamName,
        station: t.station,
        district: t.district,
        province: t.province,
        availability: t.availability || 'available',
        assignment: t.assignment || null,
        leadName: t.leadName,
        memberCount: (t.members || []).length,
      })),
    });
  } catch (err: any) {
    console.error('getAnalyticsSummary error:', err);
    return res.status(500).json({ error: 'Failed to load analytics', details: err.message });
  }
};
