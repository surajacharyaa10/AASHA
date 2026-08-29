import { Router } from 'express';
import { getAnalyticsSummary } from '../controllers/analytics.controller';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', getAnalyticsSummary);

export default router;
