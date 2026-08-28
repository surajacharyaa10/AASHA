import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { SosButton } from '@/components/sos/sos-button';
import { LocationCard } from '@/components/sos/location-card';
import { MeshStatusBanner } from '@/components/sos/mesh-banner';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  const handleTriggerSos = () => {
    setIsSosTriggered(true);
    // SOS fires instantly — no dialog, no tap required
  };

  const handleCancelSos = () => {
    setIsSosTriggered(false);
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

            <View style={styles.gpsIndicator}>
              <View style={styles.gpsGreen} />
              <Text style={styles.gpsText}>GPS Locked</Text>
            </View>
          </View>

          {/* ── BitChat BLE Peer Status Bar ───────────────── */}
          <MeshStatusBanner
            peerCount={4}
            isRelayActive={true}
            batteryPercent={78}
            isGateway={false}
          />

          {/* ── Active SOS Broadcast Status ───────────────── */}
          {isSosTriggered && (
            <Card variant="danger" style={styles.activeBanner}>
              <View style={styles.activeBannerHeader}>
                <View style={styles.activePulse} />
                <Text style={styles.activeBannerTitle}>
                  SOS BROADCASTING
                </Text>
              </View>
              <Text style={styles.activeBannerDesc}>
                Your location &amp; emergency signal is spreading phone-to-phone
                over Bluetooth. No internet or SIM needed — rescue command will
                receive it and dispatch the nearest available team.
              </Text>
              <View style={styles.waitingBox}>
                <Text style={styles.waitingText}>
                  ⏳ Awaiting rescue team dispatch from command centre
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
            lat={27.6869}
            lng={86.7314}
            elevation={2860}
            accuracy="±12m"
            locationName="Lukla East Ridge, Solukhumbu"
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
  gpsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
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