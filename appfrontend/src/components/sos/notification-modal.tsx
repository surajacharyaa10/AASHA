import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { MobileNotification } from '@/lib/notificationService';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: MobileNotification[];
  currentLocationName?: string | null;
}

const { width } = Dimensions.get('window');

export function NotificationModal({
  visible,
  onClose,
  notifications,
  currentLocationName,
}: NotificationModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.bellIconBox}>
                <Icon name="bell" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.headerTitle}>Emergency Alerts</Text>
                <Text style={styles.headerSubtitle}>
                  {notifications.length} active broadcast{notifications.length === 1 ? '' : 's'}
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Sector Location Indicator */}
          {currentLocationName && (
            <View style={styles.locationBanner}>
              <Icon name="location" size={13} color="#047857" />
              <Text style={styles.locationText} numberOfLines={1}>
                Sector: {currentLocationName}
              </Text>
            </View>
          )}

          {/* Notifications List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Icon name="check" size={36} color="#10B981" />
                <Text style={styles.emptyTitle}>All Clear in Your Sector</Text>
                <Text style={styles.emptyText}>
                  No active emergency alerts or evacuation orders reported by Disaster Management.
                </Text>
              </View>
            ) : (
              notifications.map((item) => {
                const isCritical = item.severity === 'critical';
                const isAllNepal = item.targetScope === 'all';

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.notifCard,
                      isCritical && styles.notifCardCritical,
                    ]}
                  >
                    {/* Top Tag Row */}
                    <View style={styles.cardHeader}>
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.severityPill,
                            isCritical ? styles.critPill : styles.warnPill,
                          ]}
                        >
                          <Text
                            style={[
                              styles.severityText,
                              isCritical ? styles.critText : styles.warnText,
                            ]}
                          >
                            {isCritical ? '🚨 CRITICAL' : '⚠️ WARNING'}
                          </Text>
                        </View>

                        <View style={styles.scopePill}>
                          <Text style={styles.scopeText}>
                            {isAllNepal
                              ? '🇳🇵 All Nepal'
                              : `${item.province || ''}${item.district ? ` · ${item.district}` : ''}`}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.timeText}>
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>

                    {/* Headline */}
                    <Text style={styles.notifTitle}>{item.title}</Text>

                    {/* Attached Image */}
                    {item.imageUrl && (
                      <View style={styles.imageBox}>
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.notifImage}
                          resizeMode="cover"
                        />
                      </View>
                    )}

                    {/* Message Body */}
                    <Text style={styles.notifMessage}>{item.message}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    minHeight: '45%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#64748B',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  locationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
  notifCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  notifCardCritical: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  severityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  critPill: {
    backgroundColor: '#FEE2E2',
  },
  warnPill: {
    backgroundColor: '#FEF3C7',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  critText: {
    color: '#DC2626',
  },
  warnText: {
    color: '#D97706',
  },
  scopePill: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  scopeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  notifTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  imageBox: {
    width: '100%',
    height: 160,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
    marginVertical: 8,
  },
  notifImage: {
    width: '100%',
    height: '100%',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
  },
});
