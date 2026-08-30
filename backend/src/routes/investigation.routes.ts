import { Router } from 'express';
import {
  getNearestTeamForInvestigation,
  createInvestigation,
  getInvestigations,
  getInvestigation,
  assignTeamToInvestigation,
  updateInvestigationStatus,
  handleInvestigationEmailAction,
} from '../controllers/investigation.controller';

const router = Router();

router.get('/nearest-team', getNearestTeamForInvestigation);
router.post('/', createInvestigation);
router.get('/', getInvestigations);
router.get('/:id', getInvestigation);
router.post('/:id/assign', assignTeamToInvestigation);
router.patch('/:id/status', updateInvestigationStatus);
router.get('/action', handleInvestigationEmailAction);

export default router;
