import { Router } from 'express';
import { getProfile, upsertProfile } from '../controllers/profile.controller';

const router = Router();

// GET  /api/profile/:deviceId  → fetch stored profile
router.get('/:deviceId', getProfile);

// PUT  /api/profile/:deviceId  → create or update profile
router.put('/:deviceId', upsertProfile);

export default router;
