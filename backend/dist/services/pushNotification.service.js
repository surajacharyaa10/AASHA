"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNativePushNotification = exports.registerPushToken = void 0;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("../config/database");
dotenv_1.default.config();
let isFirebaseInitialized = false;
// Initialize Firebase Admin SDK
const initFirebase = () => {
    if (isFirebaseInitialized || firebase_admin_1.default.apps.length > 0) {
        isFirebaseInitialized = true;
        return;
    }
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (projectId && clientEmail && privateKey) {
        // Handle escaped newlines in private key
        privateKey = privateKey.replace(/\\n/g, '\n');
        try {
            firebase_admin_1.default.initializeApp({
                credential: firebase_admin_1.default.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey,
                }),
            });
            isFirebaseInitialized = true;
            console.log('✓ Firebase Admin initialized for iOS & Android Push Notifications');
        }
        catch (err) {
            console.warn('⚠️ Firebase Admin initialization failed:', err);
        }
    }
    else {
        console.warn('⚠️ Missing Firebase credentials in .env. Remote push will be skipped.');
    }
};
initFirebase();
/**
 * Register device push token from iOS / Android device
 */
const registerPushToken = async (token, platform, province, district) => {
    if (!token)
        return;
    try {
        const db = await (0, database_1.connectDB)();
        const tokensCollection = db.collection('device_push_tokens');
        await tokensCollection.updateOne({ token }, {
            $set: {
                token,
                platform,
                province: province || null,
                district: district || null,
                updatedAt: new Date(),
            },
        }, { upsert: true });
    }
    catch (err) {
        console.error('Error saving push token:', err);
    }
};
exports.registerPushToken = registerPushToken;
/**
 * Send native Push Notification to iOS (APNs) and Android (FCM) lock screens
 */
const sendNativePushNotification = async (payload) => {
    if (!isFirebaseInitialized && firebase_admin_1.default.apps.length === 0) {
        initFirebase();
        if (!isFirebaseInitialized) {
            console.log('Push skipped: Firebase Admin not configured.');
            return;
        }
    }
    try {
        const db = await (0, database_1.connectDB)();
        const tokensCollection = db.collection('device_push_tokens');
        const query = {};
        if (payload.targetScope === 'targeted' && payload.province) {
            query.$or = [
                { province: payload.province },
                { province: null }, // default catch-all
            ];
            if (payload.district) {
                query.$or.push({ district: payload.district });
            }
        }
        const deviceDocs = await tokensCollection.find(query).toArray();
        const tokens = deviceDocs.map((d) => d.token).filter(Boolean);
        if (tokens.length === 0) {
            console.log('No device push tokens found matching target audience.');
            return;
        }
        // Build cross-platform payload (iOS APNs + Android FCM)
        const isCritical = payload.severity === 'critical';
        const message = {
            tokens,
            notification: {
                title: `🚨 ${payload.title}`,
                body: payload.message,
                ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
            },
            data: {
                severity: payload.severity,
                targetScope: payload.targetScope,
                province: payload.province || '',
                district: payload.district || '',
                imageUrl: payload.imageUrl || '',
            },
            // Android Specific (Lock Screen, Sound, Priority, Channel)
            android: {
                priority: 'high',
                notification: {
                    channelId: 'emergency-alerts',
                    sound: 'default',
                    priority: 'max',
                    visibility: 'public', // Show full alert content on Lock Screen
                    color: '#DC2626',
                    defaultVibrateTimings: true,
                    defaultSound: true,
                    icon: 'notification_icon',
                    ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
                },
            },
            // iOS Specific (APNs, Lock Screen, Sound, Critical Alert)
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: `🚨 ${payload.title}`,
                            body: payload.message,
                        },
                        sound: 'default',
                        badge: 1,
                        'interruption-level': isCritical ? 'time-sensitive' : 'active',
                    },
                },
                headers: {
                    'apns-priority': '10',
                    'apns-push-type': 'alert',
                },
            },
        };
        const response = await firebase_admin_1.default.messaging().sendEachForMulticast(message);
        console.log(`✓ Successfully dispatched native Push to ${response.successCount} iOS/Android devices (${response.failureCount} failed)`);
        // Clean up stale or invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                }
            });
            if (failedTokens.length > 0) {
                await tokensCollection.deleteMany({ token: { $in: failedTokens } });
            }
        }
    }
    catch (error) {
        console.error('Error dispatching native push notification:', error);
    }
};
exports.sendNativePushNotification = sendNativePushNotification;
