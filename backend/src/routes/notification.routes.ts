import { Router } from 'express';
import multer from 'multer';
import {
  createNotification,
  getNotifications,
  uploadNotificationImage,
  registerDeviceToken,
  deleteNotification,
} from '../controllers/notification.controller';

const router = Router();

// Memory storage for multer (direct upload to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// Routes
router.post('/', createNotification);
router.get('/', getNotifications);
router.post('/upload', upload.single('image'), uploadNotificationImage);
router.post('/register-token', registerDeviceToken);
router.delete('/:id', deleteNotification);

export default router;
