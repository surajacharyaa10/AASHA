"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const notification_controller_1 = require("../controllers/notification.controller");
const router = (0, express_1.Router)();
// Memory storage for multer (direct upload to Cloudinary)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
// Routes
router.post('/', notification_controller_1.createNotification);
router.get('/', notification_controller_1.getNotifications);
router.post('/upload', upload.single('image'), notification_controller_1.uploadNotificationImage);
router.post('/register-token', notification_controller_1.registerDeviceToken);
router.delete('/:id', notification_controller_1.deleteNotification);
exports.default = router;
