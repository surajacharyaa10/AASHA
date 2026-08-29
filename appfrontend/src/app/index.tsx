import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SosButton } from '@/components/sos/sos-button';
import { LocationCard } from '@/components/sos/location-card';
import { MeshStatusBanner } from '@/components/sos/mesh-banner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import * as Battery from 'expo-battery';
import { sendSos, cancelSos, subscribeToMesh, RoutingMode } from '@/lib/sosService';
import {
  initLocation,
  subscribeToLocation,
  formatAccuracy,
  formatAltitude,
  DeviceLocation,
} from '@/lib/locationService';

/**
 * AASHA SOS — Main Emergency Screen
 *
 * Architecture: BitChat-style mobile Bluetooth mesh
 *   • Pure phone-to-phone BLE — NO ESP, NO LoRa, NO external hardware
 *   • Every phone with AASHA installed automatically relays SOS packets
 *   • Any phone that gains internet connectivity auto-uploads to rescue backend
 *   • Offline-first: works with zero cellular/Wi-Fi coverage
 */
export default function HomeScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  const [isSosTriggered, setIsSosTriggered] = useState(false);
  const [note, setNote] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [location, setLocation] = useState<DeviceLocation>({
    latitude: 0,
    longitude: 0,
    altitude: null,
    accuracy: null,
    heading: null,
    placeName: null,
    loading: true,
    error: null,
  });
  const [meshState, setMeshState] = useState({
    peerCount: 0,
    isRelayActive: false,
    isGateway: false,
    routingMode: 'idle' as RoutingMode,
    uploadedByHop: null as number | null,
  });

  useEffect(() => {
    // Start GPS — requests permission on first call
    initLocation();

    // Subscribe to live location updates
    const unsubLoc = subscribeToLocation(setLocation);

    // Subscribe to mesh/SOS state
    const unsubMesh = subscribeToMesh((state) => {
      setMeshState({
        peerCount: state.peerCount,
        isRelayActive: state.isRelayActive,
        isGateway: state.isGateway,
        routingMode: state.routingMode,
        uploadedByHop: state.uploadedByHop,
      });
      setIsSosTriggered(!!state.activePacket);
    });

    // Battery monitoring
    const fetchBattery = async () => {
      const level = await Battery.getBatteryLevelAsync();
      if (level !== -1) setBatteryLevel(Math.round(level * 100));
    };
    fetchBattery();
    const batterySub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(Math.round(batteryLevel * 100));
    });

    return () => {
      unsubLoc();
      unsubMesh();
      batterySub.remove();
    };
  }, []);

  const handleTriggerSos = () => {
    sendSos({
      latitude:  location.latitude,
      longitude: location.longitude,
      battery: batteryLevel,
      note
    });
  };

  const handleCancelSos = () => {
    cancelSos();
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          {
            paddingBottom:
              safeAreaInsets.bottom + BottomTabInset + Spacing.six,
          },
        ]}
      >
        <View style={styles.container}>

          {/* ── App Header ──────────────────────────────────── */}
          <View style={styles.topBar}>
            <View>
              <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>आशा</Text>
                <Badge label="OFFLINE READY" variant={isSosTriggered ? 'danger' : 'neutral'} />
              </View>
              <Text style={styles.brandSubtitle}>
                Emergency rescue · BLE phone-to-phone mesh
              </Text>
            </View>

            {/* ── Right Action Controls (GPS + Notification) ── */}
            <View style={styles.topBarRight}>
              {/* GPS status indicator */}
              <View style={styles.gpsIndicator}>
                <View style={[
                  styles.gpsGreen,
                  location.loading && { backgroundColor: '#F59E0B' },
                  !!location.error && { backgroundColor: '#EF4444' },
                ]} />
                <Text style={[
                  styles.gpsText,
                  location.loading && { color: '#D97706' },
                  !!location.error && { color: '#DC2626' },
                ]}>
                  {location.loading
                    ? 'Getting GPS…'
                    : location.error
                    ? 'GPS Error'
                    : `GPS · ${formatAccuracy(location.accuracy)}`}
                </Text>
              </View>

              {/* Notification Button */}
              <Pressable
                onPress={() => {
                  Alert.alert(
                    'Emergency Notifications',
                    '• Mesh Network: Active & Listening\n• Sector Status: Normal\n• No active hazard warnings in your area.',
                    [{ text: 'Dismiss', style: 'default' }]
                  );
                }}
                style={({ pressed }) => [
                  styles.notificationBtn,
                  pressed && { opacity: 0.7, backgroundColor: '#E2E8F0' }
                ]}
              >
                <Icon name="bell" size={16} color="#334155" />
                <View style={styles.notifDot} />
              </Pressable>
            </View>
          </View>

          {/* ── BitChat BLE Peer Status Bar ───────────────── */}
          <MeshStatusBanner
            peerCount={meshState.peerCount}
            isRelayActive={meshState.isRelayActive}
            batteryPercent={batteryLevel}
            isGateway={meshState.isGateway}
            routingMode={meshState.routingMode}
            uploadedByHop={meshState.uploadedByHop}
          />

          {/* ── Active SOS Broadcast Status ───────────────── */}
          {isSosTriggered && (
            <Card variant="danger" style={styles.activeBanner}>
              <View style={styles.activeBannerHeader}>
                <View style={styles.activePulse} />
                <Text style={styles.activeBannerTitle}>
                  {meshState.routingMode === 'direct'
                    ? '✅ SOS SENT DIRECTLY'
                    : meshState.uploadedByHop !== null
                    ? `✅ SOS UPLOADED (HOP ${meshState.uploadedByHop})`
                    : '📡 SOS BROADCASTING VIA BLE'}
                </Text>
              </View>

              {meshState.routingMode === 'direct' ? (
                <Text style={styles.activeBannerDesc}>
                  Your device has internet — the SOS was uploaded{' '}
                  <Text style={{ fontWeight: '800' }}>directly</Text> to the
                  rescue dashboard. Rescue teams can see your location now.
                  BLE mesh relay is also active as a backup.
                </Text>
              ) : meshState.uploadedByHop !== null ? (
                <Text style={styles.activeBannerDesc}>
                  A nearby phone with internet picked up your SOS at{' '}
                  <Text style={{ fontWeight: '800' }}>hop {meshState.uploadedByHop}</Text>{' '}
                  and uploaded it to the rescue dashboard. Your location has
                  reached the rescue command centre.
                </Text>
              ) : (
                <Text style={styles.activeBannerDesc}>
                  No internet on this device — broadcasting via{' '}
                  <Text style={{ fontWeight: '800' }}>Bluetooth mesh</Text>.{' '}
                  Every nearby AASHA phone relays your SOS further. The first
                  phone that finds internet will upload it to the rescue dashboard.
                </Text>
              )}

              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>
                  {meshState.routingMode === 'direct' || meshState.uploadedByHop !== null
                    ? '📡 Rescue team dispatch in progress…'
                    : '⏳ Waiting for a gateway peer with internet…'}
                </Text>
              </View>
            </Card>
          )}

          {/* ── Main SOS Hold Button ───────────────────── */}
          <SosButton
            onTrigger={handleTriggerSos}
            isTriggered={isSosTriggered}
            onCancel={handleCancelSos}
            holdDurationMs={3000}
          />

          {/* ── Live GPS Location Card ────────────────── */}
          <LocationCard
            lat={location.latitude}
            lng={location.longitude}
            elevation={location.altitude}
            accuracy={formatAccuracy(location.accuracy)}
            placeName={location.placeName}
            loading={location.loading}
            error={location.error}
          />

          {/* ── Optional Distress Note ────────────────── */}
          <Card variant="default" style={styles.noteCard}>
            <Text style={styles.noteLabel}>OPTIONAL DISTRESS NOTE</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={3}
              placeholder="Describe situation, injuries, headcount… (included in SOS packet)"
              placeholderTextColor="#94A3B8"
              editable={!isSosTriggered}
              style={[
                styles.noteInput,
                isSosTriggered && styles.noteInputDisabled,
              ]}
            />
            {isSosTriggered && (
              <Text style={styles.noteLockedText}>
                📡 Note included in broadcast packet
              </Text>
            )}
          </Card>

          {/* ── How it works info strip ────────────────── */}
          {!isSosTriggered && (
            <View style={styles.infoStrip}>
              <Text style={styles.infoStripTitle}>
                How AASHA SOS works offline
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>📱</Text>
                <Text style={styles.infoText}>
                  Your phone broadcasts an encrypted SOS over Bluetooth
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>🔗</Text>
                <Text style={styles.infoText}>
                  Every nearby AASHA phone automatically relays it further
                  (pure phone-to-phone, no hardware needed)
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoEmoji}>🌐</Text>
                <Text style={styles.infoText}>
                  The first phone with internet uploads to the rescue dashboard
                  — your location reaches Team Echo even with zero signal
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },

  // Header
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: 1,
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gpsGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  gpsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },

  // Active SOS banner
  activeBanner: {
    marginVertical: 10,
    borderWidth: 2,
  },
  activeBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activePulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E11D48',
  },
  activeBannerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#BE123C',
    letterSpacing: 0.5,
  },
  activeBannerDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  nearestTeamBox: {
    marginTop: 12,
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  waitingBox: {
    marginTop: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 10,
    padding: 10,
  },
  waitingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7F1D1D',
    textAlign: 'center',
  },

  // Distress note
  noteCard: {
    marginVertical: 6,
  },
  noteLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  noteInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  noteInputDisabled: {
    opacity: 0.6,
    backgroundColor: '#F1F5F9',
  },
  noteLockedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 6,
  },

  // Info strip
  infoStrip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginTop: 8,
    gap: 10,
  },
  infoStripTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  infoEmoji: {
    fontSize: 16,
    width: 22,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
});