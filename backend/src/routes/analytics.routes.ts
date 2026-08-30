import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analytics.controller';
import { getSosByArea } from '../controllers/analytics.controller';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', getAnalyticsSummary);

// GET /api/analytics/sos-by-area
router.get('/sos-by-area', getSosByArea);

export default router;
