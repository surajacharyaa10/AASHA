import { Router } from 'express';
import multer from 'multer';
import {
  registerRescueTeam,
  getTeamRegistrations,
  uploadRegistrationDocument,
  updateRegistrationStatus,
  deleteRegistration,
} from '../controllers/teamRegistration.controller';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for documents
});

// Routes
router.post('/', registerRescueTeam);
router.get('/', getTeamRegistrations);
router.post('/upload-doc', upload.single('document'), uploadRegistrationDocument);
router.patch('/:id/status', updateRegistrationStatus);
router.delete('/:id', deleteRegistration);

export default router;
