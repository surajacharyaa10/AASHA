"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeviceToken = exports.deleteNotification = exports.uploadNotificationImage = exports.getNotifications = exports.createNotification = void 0;
const database_1 = require("../config/database");
const mongodb_1 = require("mongodb");
const pushNotification_service_1 = require("../services/pushNotification.service");
// 1. Create and broadcast emergency notification
const createNotification = async (req, res) => {
    try {
        const { title, message, targetScope = 'all', province, district, imageUrl, severity = 'critical', category = 'disaster', } = req.body;
        if (!title || !message) {
            return res.status(400).json({ error: 'Title and message are required' });
        }
        if (targetScope === 'targeted' && !province) {
            return res.status(400).json({ error: 'Province is required for targeted notifications' });
        }
        const db = await (0, database_1.connectDB)();
        const notificationsCollection = db.collection('emergency_notifications');
        const notificationDoc = {
            title: title.trim(),
            message: message.trim(),
            targetScope: targetScope === 'all' ? 'all' : 'targeted',
            province: targetScope === 'targeted' ? (province || null) : null,
            district: targetScope === 'targeted' ? (district || null) : null,
            imageUrl: imageUrl || null,
            severity: severity || 'critical',
            category: category || 'disaster',
            createdAt: new Date(),
            createdBy: 'Admin / Command Center',
            acknowledgedCount: 0,
        };
        const result = await notificationsCollection.insertOne(notificationDoc);
        const savedNotification = {
            id: result.insertedId.toString(),
            ...notificationDoc,
        };
        // Broadcast in real-time via Socket.io (for foreground & web dashboard)
        const io = req.app.get('io');
        if (io) {
            io.emit('emergency:notification', savedNotification);
        }
        // Broadcast native Push Notification to iOS (APNs) and Android (FCM) Lock Screens
        (0, pushNotification_service_1.sendNativePushNotification)({
            title: notificationDoc.title,
            message: notificationDoc.message,
            targetScope: notificationDoc.targetScope,
            province: notificationDoc.province,
            district: notificationDoc.district,
            imageUrl: notificationDoc.imageUrl,
            severity: notificationDoc.severity,
        }).catch((err) => {
            console.warn('Native push background dispatch warning:', err);
        });
        return res.status(201).json({
            success: true,
            notification: savedNotification,
        });
    }
    catch (error) {
        console.error('Error creating emergency notification:', error);
        return res.status(500).json({ error: 'Failed to create emergency notification' });
    }
};
exports.createNotification = createNotification;
// 2. Get notifications (with optional filtering by province/district)
const getNotifications = async (req, res) => {
    try {
        const db = await (0, database_1.connectDB)();
        const notificationsCollection = db.collection('emergency_notifications');
        const { province, district, limit = 50 } = req.query;
        const query = {};
        if (province) {
            query.$or = [
                { targetScope: 'all' },
                {
                    targetScope: 'targeted',
                    province: province,
                    ...(district ? { $or: [{ district: null }, { district }] } : {}),
                },
            ];
        }
        const notifications = await notificationsCollection
            .find(query)
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .toArray();
        return res.json({
            notifications: notifications.map((n) => ({
                id: n._id.toString(),
                title: n.title,
                message: n.message,
                targetScope: n.targetScope,
                province: n.province,
                district: n.district,
                imageUrl: n.imageUrl,
                severity: n.severity,
                category: n.category,
                createdAt: n.createdAt,
                createdBy: n.createdBy,
                acknowledgedCount: n.acknowledgedCount || 0,
            })),
        });
    }
    catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({ error: 'Failed to fetch emergency notifications' });
    }
};
exports.getNotifications = getNotifications;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// 3. Local Upload Endpoint
const uploadNotificationImage = async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No image file uploaded. Make sure field name is "image".' });
        }
        const ext = path_1.default.extname(file.originalname) || '.jpg';
        const filename = `alert_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        const filepath = path_1.default.join(__dirname, '../../public/uploads', filename);
        fs_1.default.writeFileSync(filepath, file.buffer);
        return res.json({
            success: true,
            url: `http://localhost:4000/uploads/${filename}`,
            publicId: filename,
        });
    }
    catch (error) {
        console.error('Local notification image upload error:', error);
        return res.status(500).json({
            error: 'Failed to upload image locally',
            details: error.message || String(error),
        });
    }
};
exports.uploadNotificationImage = uploadNotificationImage;
// 4. Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongodb_1.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid notification ID' });
        }
        const db = await (0, database_1.connectDB)();
        const notificationsCollection = db.collection('emergency_notifications');
        const result = await notificationsCollection.deleteOne({ _id: new mongodb_1.ObjectId(id) });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        return res.json({ success: true, message: 'Notification deleted' });
    }
    catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({ error: 'Failed to delete notification' });
    }
};
exports.deleteNotification = deleteNotification;
// 5. Register device push token from mobile device
const registerDeviceToken = async (req, res) => {
    try {
        const { token, platform, province, district } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Device token is required' });
        }
        await (0, pushNotification_service_1.registerPushToken)(token, platform || 'android', province, district);
        return res.json({ success: true, message: 'Device push token registered' });
    }
    catch (error) {
        console.error('Error registering device token:', error);
        return res.status(500).json({ error: 'Failed to register push token' });
    }
};
exports.registerDeviceToken = registerDeviceToken;
