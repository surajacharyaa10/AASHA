import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { MobileNotification } from '@/lib/notificationService';
import { Icon } from '@/components/ui/icon';

interface EmergencyHeadsUpBannerProps {
  notification: MobileNotification | null;
  onPress: () => void;
  onDismiss: () => void;
}

const { width } = Dimensions.get('window');

export function EmergencyHeadsUpBanner({
  notification,
  onPress,
  onDismiss,
}: EmergencyHeadsUpBannerProps) {
  const slideAnim = useRef(new Animated.Value(-200)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (notification) {
      // 1. Slide down animation
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
        speed: 12,
      }).start();

      // 2. Pulse badge animation
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // 3. Auto dismiss after 10s if not dismissed manually
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, 10000);

      return () => {
        pulseLoop.stop();
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    } else {
      slideAnim.setValue(-200);
    }
  }, [notification]);

  const handleDismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -200,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  };

  if (!notification) return null;

  const isCritical = notification.severity === 'critical';
  const isAllNepal = notification.targetScope === 'all';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.bannerCard,
          isCritical ? styles.critCard : styles.warnCard,
          pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
        ]}
      >
        {/* Top Accent Bar */}
        <View
          style={[
            styles.accentBar,
            { backgroundColor: isCritical ? '#DC2626' : '#D97706' },
          ]}
        />

        <View style={styles.cardInner}>
          {/* Icon & Headline Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Animated.View
                style={[
                  styles.iconBadge,
                  isCritical ? styles.critBadge : styles.warnBadge,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Text style={styles.iconEmoji}>{isCritical ? '🚨' : '⚠️'}</Text>
              </Animated.View>

              <View style={styles.titleColumn}>
                <View style={styles.tagRow}>
                  <Text style={[styles.alertTag, isCritical ? styles.critTag : styles.warnTag]}>
                    {isCritical ? 'CRITICAL DISASTER ALERT' : 'EMERGENCY WARNING'}
                  </Text>
                  <View style={styles.scopeTag}>
                    <Text style={styles.scopeTagText}>
                      {isAllNepal
                        ? '🇳🇵 All Nepal'
                        : `${notification.province || ''}${notification.district ? ` · ${notification.district}` : ''}`}
                    </Text>
                  </View>
                </View>

                <Text style={styles.headline} numberOfLines={1}>
                  {notification.title}
                </Text>
              </View>
            </View>

            {/* Dismiss X */}
            <Pressable onPress={handleDismiss} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          {/* Attached image preview if available */}
          {notification.imageUrl && (
            <View style={styles.imagePreviewBox}>
              <Image
                source={{ uri: notification.imageUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Message snippet */}
          <Text style={styles.messageText} numberOfLines={2}>
            {notification.message}
          </Text>

          {/* Tap hint */}
          <View style={styles.actionHint}>
            <Text style={styles.actionHintText}>Tap to view details & safe instructions →</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 40,
    left: 12,
    right: 12,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 25,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  critCard: {
    borderColor: '#F87171',
    backgroundColor: '#FFF8F8',
  },
  warnCard: {
    borderColor: '#FBBF24',
    backgroundColor: '#FFFDF5',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  cardInner: {
    padding: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  critBadge: {
    backgroundColor: '#FEE2E2',
  },
  warnBadge: {
    backgroundColor: '#FEF3C7',
  },
  iconEmoji: {
    fontSize: 18,
  },
  titleColumn: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  alertTag: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  critTag: {
    color: '#DC2626',
  },
  warnTag: {
    color: '#D97706',
  },
  scopeTag: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  scopeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#475569',
  },
  headline: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  imagePreviewBox: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
    backgroundColor: '#0F172A',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  messageText: {
    fontSize: 12,
    lineHeight: 17,
    color: '#334155',
    marginTop: 8,
    fontWeight: '500',
  },
  actionHint: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionHintText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
  },
});
