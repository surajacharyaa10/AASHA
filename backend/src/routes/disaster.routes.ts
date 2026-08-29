import { Router } from 'express';
import { getLatestDisastersByCountry, getLatestDisastersByLatLng, getDisasterGeometry } from '../controllers/disaster.controller';

const router = Router();

router.get('/latest/by-country-code', getLatestDisastersByCountry);
router.get('/latest/by-lat-lng', getLatestDisastersByLatLng);
router.get('/geometry/by-source-eventId', getDisasterGeometry);

export default router;
