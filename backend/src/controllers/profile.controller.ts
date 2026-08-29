import { Request, Response } from 'express';
import { connectDB } from '../config/database';

// A simple device-keyed profile document.
// We use `deviceId` as the identifier so the mobile app
// doesn't need an auth token — it just sends its deviceId.

const COLLECTION = 'user_profiles';

// GET /api/profile/:deviceId
const getProfile = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const db = await connectDB();
    const col = db.collection(COLLECTION);

    const doc = await col.findOne({ deviceId });

    if (!doc) {
      // No profile yet — return empty defaults
      return res.json({
        deviceId,
        name: '',
        address: '',
        email: '',
        phone: '',
        bloodGroup: '',
      });
    }

    return res.json({
      deviceId: doc.deviceId,
      name: doc.name ?? '',
      address: doc.address ?? '',
      email: doc.email ?? '',
      phone: doc.phone ?? '',
      bloodGroup: doc.bloodGroup ?? '',
    });
  } catch (error) {
    console.error('[profile] getProfile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /api/profile/:deviceId
const upsertProfile = async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;
    const { name, address, email, phone, bloodGroup } = req.body;

    if (!deviceId) {
      return res.status(400).json({ error: 'deviceId is required' });
    }

    const db = await connectDB();
    const col = db.collection(COLLECTION);

    const updatedAt = new Date();

    await col.updateOne(
      { deviceId },
      {
        $set: {
          deviceId,
          name: name ?? '',
          address: address ?? '',
          email: email ?? '',
          phone: phone ?? '',
          bloodGroup: bloodGroup ?? '',
          updatedAt,
        },
        $setOnInsert: {
          createdAt: updatedAt,
        },
      },
      { upsert: true },
    );

    return res.json({
      deviceId,
      name: name ?? '',
      address: address ?? '',
      email: email ?? '',
      phone: phone ?? '',
      bloodGroup: bloodGroup ?? '',
    });
  } catch (error) {
    console.error('[profile] upsertProfile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { getProfile, upsertProfile };
