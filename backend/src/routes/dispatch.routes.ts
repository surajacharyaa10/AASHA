import { Router } from 'express';
import { getNearestTeam, dispatchRescueTeam } from '../controllers/dispatch.controller';

const router = Router();

// GET /api/dispatch/nearest?lat=27.69&lng=86.73
router.get('/nearest', getNearestTeam);

// POST /api/dispatch  — full dispatch: find team + update SOS + send emails
router.post('/', dispatchRescueTeam);

export default router;
