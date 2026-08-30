import { Router } from 'express';
import { getNepalResources } from '../controllers/resources.controller';

const router = Router();

router.get('/osm/nepal', getNepalResources);

export default router;
