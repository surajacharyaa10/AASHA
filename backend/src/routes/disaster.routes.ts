import { Router } from 'express';
import { getLatestDisastersByCountry, getLatestDisastersByLatLng, getDisasterGeometry } from '../controllers/disaster.controller';
import { getLiveHazards } from '../controllers/liveHazards.controller';

const router = Router();

router.get('/latest/by-country-code', getLatestDisastersByCountry);
router.get('/latest/by-lat-lng', getLatestDisastersByLatLng);
router.get('/geometry/by-source-eventId', getDisasterGeometry);
router.get('/live-hazards', getLiveHazards);

export default router;
