import express from 'express';
import { createSosEvent, getSosEvents, getSosEvent, assignTeam, resolveEvent } from '../controllers/sos.controller';
import { handleEmailAction } from '../controllers/sosAction.controller';
import { validate } from '../middleware/validate';
import { createSosSchema, assignTeamSchema, resolveEventSchema } from '../schemas/sos.schema';

const router = express.Router();

// One-click action link from dispatch emails (no auth — protected by HMAC token in query)
router.get('/action', handleEmailAction);

router.post('/', validate(createSosSchema), createSosEvent);
router.get('/', getSosEvents);
router.get('/:id', getSosEvent);
router.patch('/:id/assign', validate(assignTeamSchema), assignTeam);
router.patch('/:id/resolve', validate(resolveEventSchema), resolveEvent);

export default router;