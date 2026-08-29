import admin from 'firebase-admin';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';

dotenv.config();

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK
const initFirebase = () => {
  if (isFirebaseInitialized || admin.apps.length > 0) {
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
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isFirebaseInitialized = true;
      console.log('✓ Firebase Admin initialized for iOS & Android Push Notifications');
    } catch (err) {
      console.warn('⚠️ Firebase Admin initialization failed:', err);
    }
  } else {
    console.warn('⚠️ Missing Firebase credentials in .env. Remote push will be skipped.');
  }
};

initFirebase();

/**
 * Register device push token from iOS / Android device
 */
export const registerPushToken = async (
  token: string,
  platform: 'ios' | 'android',
  province?: string | null,
  district?: string | null
) => {
  if (!token) return;
  try {
    const db = await connectDB();
    const tokensCollection = db.collection('device_push_tokens');

    await tokensCollection.updateOne(
      { token },
      {
        $set: {
          token,
          platform,
          province: province || null,
          district: district || null,
          updatedAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error('Error saving push token:', err);
  }
};

/**
 * Send native Push Notification to iOS (APNs) and Android (FCM) lock screens
 */
export const sendNativePushNotification = async (payload: {
  title: string;
  message: string;
  targetScope: 'all' | 'targeted';
  province?: string | null;
  district?: string | null;
  imageUrl?: string | null;
  severity: 'critical' | 'warning' | 'info';
}) => {
  if (!isFirebaseInitialized && admin.apps.length === 0) {
    initFirebase();
    if (!isFirebaseInitialized) {
      console.log('Push skipped: Firebase Admin not configured.');
      return;
    }
  }

  try {
    const db = await connectDB();
    const tokensCollection = db.collection('device_push_tokens');

    const query: any = {};
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

    const message: admin.messaging.MulticastMessage = {
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

    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `✓ Successfully dispatched native Push to ${response.successCount} iOS/Android devices (${response.failureCount} failed)`
    );

    // Clean up stale or invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      if (failedTokens.length > 0) {
        await tokensCollection.deleteMany({ token: { $in: failedTokens } });
      }
    }
  } catch (error) {
    console.error('Error dispatching native push notification:', error);
  }
};
