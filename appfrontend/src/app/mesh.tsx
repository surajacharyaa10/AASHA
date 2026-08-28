import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible } from '@/components/ui/collapsible';



interface PacketLog {
  id: string;
  origin: string;
  seenFrom: string;
  time: string;
  status: 'Relayed' | 'Origin' | 'Dedup Skip';
  rssi: string;
}

const SAMPLE_PACKETS: PacketLog[] = [
  {
    id: 'SOS-A4B1-01',
    origin: 'Anon Device #42',
    seenFrom: 'Anon Device #19',
    rssi: '-68 dBm',
    time: '14:27:04',
    status: 'Relayed',
  },
  {
    id: 'SOS-A4B1-01',
    origin: 'Anon Device #42',
    seenFrom: 'Anon Device #07',
    rssi: '-82 dBm',
    time: '14:27:12',
    status: 'Dedup Skip',
  },
  {
    id: 'SOS-8F22-09',
    origin: 'Anon Device #71',
    seenFrom: 'Anon Device #55',
    rssi: '-74 dBm',
    time: '14:21:40',
    status: 'Relayed',
  },
  {
    id: 'SOS-7C11-88',
    origin: 'This Device (Owner SOS)',
    seenFrom: '— (own broadcast)',
    rssi: 'Local BLE',
    time: '14:15:22',
    status: 'Origin',
  },
];

export default function MeshScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [relayEnabled, setRelayEnabled] = useState(true);
  const [dutyCycleMode, setDutyCycleMode] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.six },
        ]}
      >
        <View style={styles.container}>

          {/* ── Header ──────────────────────────────────────── */}
          <View style={styles.topBar}>
            <View>
              <View style={styles.brandRow}>
                <Text style={styles.brandTitle}>Mesh Relay</Text>
                <Badge label="PHONE-TO-PHONE BLE" variant="info" />
              </View>
              <Text style={styles.brandSubtitle}>
                Pure Bluetooth · No hardware · No SIM needed
              </Text>
            </View>
          </View>

         



          {/* ── Live Metric Grid ─────────────────────────────── */}
          <View style={styles.metricsGrid}>
            <Card variant="default" style={styles.metricCard}>
              <Text style={styles.metricLabel}>NEARBY PHONES</Text>
              <Text style={styles.metricValue}>04</Text>
              <Text style={styles.metricSub}>With AASHA installed</Text>
            </Card>

            <Card variant="default" style={styles.metricCard}>
              <Text style={styles.metricLabel}>PACKETS RELAYED</Text>
              <Text style={styles.metricValue}>18</Text>
              <Text style={styles.metricSub}>0 dropped</Text>
            </Card>

            <Card variant="default" style={styles.metricCard}>
              <Text style={styles.metricLabel}>DEDUP CACHE</Text>
              <Text style={styles.metricValue}>1.4 KB</Text>
              <Text style={styles.metricSub}>30-min TTL window</Text>
            </Card>

            <Card variant="default" style={styles.metricCard}>
              <Text style={styles.metricLabel}>RADIO DRAIN</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>~0.8%/hr</Text>
              <Text style={styles.metricSub}>Duty-cycle active</Text>
            </Card>
          </View>

          {/* ── Live Packet Feed ─────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Live BLE Packet Feed</Text>
              <Badge label="LIVE" variant="success" />
            </View>
            <Text style={styles.sectionSub}>
              Signed SOS packets seen over Bluetooth — phone to phone, no hardware
            </Text>

            <View style={styles.packetList}>
              {SAMPLE_PACKETS.map((pkt, idx) => (
                <Card key={idx} variant="default" style={styles.packetCard}>
                  <View style={styles.packetHeader}>
                    <Text style={styles.packetId}>{pkt.id}</Text>
                    <Badge
                      label={pkt.status}
                      variant={
                        pkt.status === 'Relayed'
                          ? 'success'
                          : pkt.status === 'Origin'
                          ? 'danger'
                          : 'neutral'
                      }
                    />
                  </View>

                  <View style={styles.packetMetaRow}>
                    <Text style={styles.packetMeta}>Origin: {pkt.origin}</Text>
                    <Text style={styles.packetMeta}>RSSI: {pkt.rssi}</Text>
                  </View>
                  <View style={styles.packetMetaRow}>
                    <Text style={styles.packetMeta}>Received from: {pkt.seenFrom}</Text>
                    <Text style={styles.packetMeta}>{pkt.time}</Text>
                  </View>
                </Card>
              ))}
            </View>
          </View>

          {/* ── Technical Detail Accordion ───────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Protocol Details</Text>
            <Text style={styles.sectionSub}>
              Tap to read how the BLE mesh operates
            </Text>

            <View style={styles.accordionList}>
              <Collapsible title="📦 Packet Format (47 bytes)">
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}>
                    Each SOS packet fits in a BLE advertisement frame:{'\n'}
                    • <Text style={styles.bold}>packet_id</Text> — 8-byte unique ID for dedup{'\n'}
                    • <Text style={styles.bold}>device_id</Text> — anonymised origin fingerprint{'\n'}
                    • <Text style={styles.bold}>lat / lng</Text> — 4 bytes each (float32){'\n'}
                    • <Text style={styles.bold}>timestamp</Text> — 4 bytes Unix epoch{'\n'}
                    • <Text style={styles.bold}>battery</Text> — 1 byte percent{'\n'}
                    • <Text style={styles.bold}>HMAC signature</Text> — 8 bytes anti-spoof
                  </Text>
                </View>
              </Collapsible>

              <Collapsible title="🔁 Relay & Dedup Logic">
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}>
                    1. Phone scans for BLE advertisements from other AASHA phones{'\n'}
                    2. On receiving a packet, check local dedup cache for <Text style={styles.bold}>packet_id</Text>{'\n'}
                    3. If already seen → silently ignore (prevents broadcast storms){'\n'}
                    4. If new → add to cache, re-advertise on BLE immediately{'\n'}
                    5. If this phone has internet → POST to rescue backend in parallel{'\n'}
                    6. Cache entries expire after 30 min to reclaim memory
                  </Text>
                </View>
              </Collapsible>

              <Collapsible title="🔒 Anti-Spoof Security">
                <View style={styles.accordionContent}>
                  <Text style={styles.accordionText}>
                    Every packet is HMAC-signed with a device-registered secret
                    key stored in encrypted storage. The backend and every relay
                    node validates the signature before forwarding — fake or
                    tampered SOS packets are silently dropped.
                  </Text>
                </View>
              </Collapsible>
            </View>
          </View>

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
  topBar: {
    marginBottom: 14,
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
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  explanationCard: {
    marginBottom: 14,
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  explanationDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    fontWeight: '500',
  },
  controlCard: {
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextCol: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  switchSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
    lineHeight: 16,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    padding: 14,
    borderRadius: 16,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 4,
  },
  metricSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  packetList: {
    gap: 8,
  },
  packetCard: {
    padding: 12,
    borderRadius: 14,
  },
  packetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  packetId: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  packetMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  packetMeta: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  accordionList: {
    gap: 10,
  },
  accordionContent: {
    paddingTop: 8,
  },
  accordionText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 20,
    fontWeight: '500',
  },
  bold: {
    fontWeight: '800',
    color: '#0F172A',
  },
});