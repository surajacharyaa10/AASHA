import express from 'express';
import { createSosEvent, getSosEvents, getSosEvent, assignTeam, resolveEvent } from '../controllers/sos.controller';
import { validate } from '../middleware/validate';
import { createSosSchema, assignTeamSchema, resolveEventSchema } from '../schemas/sos.schema';

const router = express.Router();

router.post('/', validate(createSosSchema), createSosEvent);
router.get('/', getSosEvents);
router.get('/:id', getSosEvent);
router.patch('/:id/assign', validate(assignTeamSchema), assignTeam);
router.patch('/:id/resolve', validate(resolveEventSchema), resolveEvent);

export default router;