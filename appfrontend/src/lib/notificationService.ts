import { Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { io, Socket } from 'socket.io-client';

export interface MobileNotification {
  id: string;
  title: string;
  message: string;
  targetScope: 'all' | 'targeted';
  province?: string;
  district?: string;
  imageUrl?: string;
  severity: 'critical' | 'warning' | 'info';
  category?: string;
  createdAt: string;
  createdBy?: string;
}

import BACKEND_URL from '@/lib/config';

const NOTIF_CACHE_KEY = 'aasha_emergency_notifications_cache';

let cachedNotifications: MobileNotification[] = [];
let listeners: ((notifs: MobileNotification[]) => void)[] = [];
let incomingAlertListeners: ((incoming: MobileNotification) => void)[] = [];
let socket: Socket | null = null;
let currentProvince: string | null = null;
let currentDistrict: string | null = null;

/**
 * Triggers sound, haptics & vibration for emergency alerts
 */
export const triggerLocalEmergencyAlert = async (notif: MobileNotification) => {
  try {
    if (Platform.OS !== 'web') {
      // 1. Emergency vibration pattern: pulse alert
      Vibration.vibrate([0, 600, 200, 600, 200, 1000]);

      // 2. Urgent haptic feedback
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  } catch (err) {
    console.error('[NotificationService] Failed to trigger alert:', err);
  }
};

/**
 * Read cached alerts from AsyncStorage
 */
export const getCachedNotifications = async (): Promise<MobileNotification[]> => {
  if (cachedNotifications.length > 0) return cachedNotifications;
  try {
    const raw = await AsyncStorage.getItem(NOTIF_CACHE_KEY);
    if (raw) {
      cachedNotifications = JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading cached notifications:', err);
  }
  return cachedNotifications;
};

/**
 * Fetch latest notifications from backend and update cache
 */
export const fetchEmergencyNotifications = async (
  province?: string | null,
  district?: string | null
): Promise<MobileNotification[]> => {
  if (province) currentProvince = province;
  if (district) currentDistrict = district;

  try {
    let url = `${BACKEND_URL}/api/notifications`;
    const params: string[] = [];
    if (province) params.push(`province=${encodeURIComponent(province)}`);
    if (district) params.push(`district=${encodeURIComponent(district)}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data?.notifications) {
        cachedNotifications = data.notifications;
        await AsyncStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(cachedNotifications));
        notifyListeners();
        return cachedNotifications;
      }
    }
  } catch (err) {
    console.warn('[NotificationService] Fetch failed, using offline cache:', err);
  }
  return getCachedNotifications();
};

/**
 * Initialize Socket.io real-time listener for instant emergency notifications
 */
export const initRealtimeNotifications = (
  userProvince?: string | null,
  userDistrict?: string | null
) => {
  if (socket) return;

  try {
    socket = io(BACKEND_URL, {
      reconnectionAttempts: 10,
      timeout: 10000,
    });

    socket.on('emergency:notification', (incoming: MobileNotification) => {
      // Check if alert matches user scope: 'all' OR matching province/district
      const isForUser =
        incoming.targetScope === 'all' ||
        !incoming.province ||
        incoming.province === userProvince ||
        incoming.province === currentProvince;

      if (isForUser) {
        // Add to cached notifications
        if (!cachedNotifications.some((n) => n.id === incoming.id)) {
          cachedNotifications = [incoming, ...cachedNotifications];
          AsyncStorage.setItem(NOTIF_CACHE_KEY, JSON.stringify(cachedNotifications));
          notifyListeners();
        }

        // Trigger sound, vibration, haptics
        triggerLocalEmergencyAlert(incoming);

        // Notify incoming banner listeners to show AwesomeNotification-style dropdown
        incomingAlertListeners.forEach((cb) => cb(incoming));
      }
    });
  } catch (err) {
    console.error('[NotificationService] Socket init error:', err);
  }
};

export const subscribeToNotifications = (cb: (notifs: MobileNotification[]) => void) => {
  listeners.push(cb);
  cb(cachedNotifications);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
};

export const subscribeToIncomingAlerts = (cb: (incoming: MobileNotification) => void) => {
  incomingAlertListeners.push(cb);
  return () => {
    incomingAlertListeners = incomingAlertListeners.filter((l) => l !== cb);
  };
};

const notifyListeners = () => {
  listeners.forEach((cb) => cb(cachedNotifications));
};
