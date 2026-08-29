import { Request, Response } from 'express';
import { connectDB } from '../config/database';
import { CreateSosInput, AssignTeamInput, ResolveEventInput } from '../schemas/sos.schema';
import { sosQueue } from '../queue/sosQueue';
import { ObjectId } from 'mongodb';

// Create SOS event
const createSosEvent = async (req: Request<{}, {}, CreateSosInput>, res: Response) => {
  try {
    const eventData = req.body;
    const db = await connectDB();
    const sosEventsCollection = db.collection('sos_events');

    // 1. Atomically insert or detect duplicate using upsert
    // This is race-condition safe: if two requests arrive simultaneously,
    // only one will succeed because packetId has a unique index in MongoDB.
    const receivedAt = new Date();
    let insertResult: any;
    try {
      insertResult = await sosEventsCollection.insertOne({
        packetId: eventData.packetId,
        originDeviceId: eventData.originDeviceId,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        battery: eventData.battery ?? null,
        hopCount: eventData.hopCount ?? 0,
        note: eventData.note ?? null,
        status: 'pending',
        reportedAt: new Date(eventData.reportedAt),
        receivedAt,
        assignedTeamId: null,
        resolvedAt: null,
      });
    } catch (insertErr: any) {
      // Duplicate key error (code 11000) means this packet was already received
      if (insertErr?.code === 11000) {
        return res.status(409).json({ accepted: false, reason: 'duplicate' });
      }
      throw insertErr;
    }

    // 2. Enqueue for any additional async processing (notifications, etc.)
    await sosQueue.add('processSosEvent', eventData);

    // 3. Emit real-time socket update to dashboard
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('sos:new', {
        id: insertResult.insertedId.toString(),
        packetId: eventData.packetId,
        originDeviceId: eventData.originDeviceId,
        latitude: eventData.latitude,
        longitude: eventData.longitude,
        battery: eventData.battery,
        hopCount: eventData.hopCount,
        note: eventData.note ?? null,
        status: 'pending',
        reportedAt: eventData.reportedAt,
        receivedAt: receivedAt.toISOString()
      });
    }

    res.status(202).json({
      accepted: true,
      packetId: eventData.packetId
    });
  } catch (error) {
    console.error('Create SOS event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get SOS events
const getSosEvents = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const sosEventsCollection = db.collection('sos_events');
    const { status, from, to, limit = 50, cursor } = req.query;

    const query: any = {};
    if (status) query.status = status;
    if (from) query.reportedAt = { $gte: new Date(from as string) };
    if (to) query.reportedAt = { ...query.reportedAt, $lte: new Date(to as string) };

    const events = await sosEventsCollection
      .find(query)
      .sort({ reportedAt: -1 })
      .limit(Number(limit))
      .toArray();

    res.json({
      events: events.map(event => ({
        id: event._id.toString(),
        packetId: event.packetId,
        latitude: event.latitude,
        longitude: event.longitude,
        battery: event.battery,
        hopCount: event.hopCount,
        note: event.note ?? null,
        status: event.status,
        reportedAt: event.reportedAt,
        receivedAt: event.receivedAt,
        assignedTeamId: event.assignedTeamId ?? null,
        resolvedAt: event.resolvedAt ?? null
      })),
      nextCursor: events.length === Number(limit) ? events[events.length - 1]._id.toString() : null
    });
  } catch (error) {
    console.error('Get SOS events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get single SOS event
const getSosEvent = async (req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const sosEventsCollection = db.collection('sos_events');
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { packetId: id };
    }

    const event = await sosEventsCollection.findOne(query);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({
      id: event._id.toString(),
      packetId: event.packetId,
      latitude: event.latitude,
      longitude: event.longitude,
      battery: event.battery,
      hopCount: event.hopCount,
      note: event.note ?? null,
      status: event.status,
      reportedAt: event.reportedAt,
      receivedAt: event.receivedAt,
      assignedTeamId: event.assignedTeamId ?? null,
      resolvedAt: event.resolvedAt ?? null
    });
  } catch (error) {
    console.error('Get SOS event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Assign rescue team to SOS event
const assignTeam = async (req: Request<{ id: string }, {}, AssignTeamInput>, res: Response) => {
  try {
    const { id } = req.params;
    const { teamId } = req.body;
    const db = await connectDB();
    const sosEventsCollection = db.collection('sos_events');

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { packetId: id };
    }

    const event = await sosEventsCollection.findOne(query);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Try to get team details to send a descriptive update
    const rescueTeamsCollection = db.collection('rescue_teams');
    let teamName = 'Assigned Team';
    if (ObjectId.isValid(teamId)) {
      const team = await rescueTeamsCollection.findOne({ _id: new ObjectId(teamId) });
      if (team) {
        teamName = team.name;
      }
    } else {
      const team = await rescueTeamsCollection.findOne({ id: teamId });
      if (team) {
        teamName = team.name;
      }
    }

    const updatedEvent = await sosEventsCollection.findOneAndUpdate(
      query,
      { $set: { status: 'assigned', assignedTeamId: teamId } },
      { returnDocument: 'after' }
    );

    const resultEvent = updatedEvent && ('value' in updatedEvent ? updatedEvent.value : updatedEvent);

    if (!resultEvent) {
      return res.status(404).json({ error: 'Event not found or failed to update' });
    }

    // Emit event socket update
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('sos:updated', {
        id: resultEvent._id.toString(),
        packetId: resultEvent.packetId,
        latitude: resultEvent.latitude,
        longitude: resultEvent.longitude,
        battery: resultEvent.battery,
        hopCount: resultEvent.hopCount,
        status: 'assigned',
        reportedAt: resultEvent.reportedAt,
        receivedAt: resultEvent.receivedAt,
        assignedTeamId: teamId,
        assignedTeamName: teamName
      });
    }

    res.json({
      id: resultEvent._id.toString(),
      packetId: resultEvent.packetId,
      status: 'assigned',
      assignedTeamId: teamId,
      assignedTeamName: teamName
    });
  } catch (error) {
    console.error('Assign team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Resolve SOS event
const resolveEvent = async (req: Request<{ id: string }, {}, ResolveEventInput>, res: Response) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const db = await connectDB();
    const sosEventsCollection = db.collection('sos_events');

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { _id: new ObjectId(id) };
    } else {
      query = { packetId: id };
    }

    const event = await sosEventsCollection.findOne(query);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const resolvedAt = new Date();
    const updatedEvent = await sosEventsCollection.findOneAndUpdate(
      query,
      { $set: { status: resolution, resolvedAt } },
      { returnDocument: 'after' }
    );

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const resultEvent = ('value' in updatedEvent && updatedEvent.value) ? updatedEvent.value : updatedEvent;

    // If event was assigned to a team, update the team's status back to available
    if (resultEvent && resultEvent.assignedTeamId) {
      try {
        await db.collection('rescue_team_registrations').updateOne(
          { _id: new ObjectId(resultEvent.assignedTeamId) },
          {
            $set: {
              availability: 'available',
              assignment: null,
              updatedAt: new Date(),
            },
          }
        );
      } catch (err) {
        console.error('Failed to update team availability on resolve:', err);
      }
    }

    // Emit event socket update
    const io = (req.app as any).get('io');
    if (io) {
      io.emit('sos:updated', {
        id: resultEvent._id.toString(),
        packetId: resultEvent.packetId,
        latitude: resultEvent.latitude,
        longitude: resultEvent.longitude,
        battery: resultEvent.battery,
        hopCount: resultEvent.hopCount,
        status: resolution,
        reportedAt: resultEvent.reportedAt,
        receivedAt: resultEvent.receivedAt,
        resolvedAt
      });
    }

    res.json({
      id: resultEvent._id.toString(),
      packetId: resultEvent.packetId,
      status: resolution,
      resolvedAt
    });
  } catch (error) {
    console.error('Resolve event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export { createSosEvent, getSosEvents, getSosEvent, assignTeam, resolveEvent };