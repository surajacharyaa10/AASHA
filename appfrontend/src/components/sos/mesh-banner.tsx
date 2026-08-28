import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MeshStatusBannerProps {
  peerCount?: number;
  isRelayActive?: boolean;
  batteryPercent?: number;
  isGateway?: boolean;
}

export function MeshStatusBanner({
  peerCount = 4,
  isRelayActive = true,
  batteryPercent = 78,
  isGateway = false,
}: MeshStatusBannerProps) {
  return (
    <View style={styles.container}>
      {/* BitChat Mesh Node Status */}
      <View style={styles.item}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, isRelayActive && styles.dotActive]} />
          <Text style={styles.label}>BITCHAT MESH</Text>
        </View>
        <Text style={styles.value}>
          {isRelayActive ? `${peerCount} Peers Visible` : 'Scanning…'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Connectivity / Gateway status */}
      <View style={styles.item}>
        <Text style={styles.label}>CONNECTIVITY</Text>
        <Text style={[styles.value, isGateway ? styles.gatewayOnline : styles.gatewayOffline]}>
          {isGateway ? 'Online · Auto-relay' : 'Offline · BLE Mesh'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Battery */}
      <View style={styles.item}>
        <Text style={styles.label}>BATTERY</Text>
        <Text style={[
          styles.value,
          batteryPercent < 20 ? styles.batteryLow : styles.batteryOk,
        ]}>
          {batteryPercent}%
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#475569',
  },
  dotActive: {
    backgroundColor: '#22C55E',
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
    textAlign: 'center',
  },
  gatewayOnline: {
    color: '#38BDF8',
  },
  gatewayOffline: {
    color: '#FCD34D',
  },
  batteryLow: {
    color: '#F87171',
  },
  batteryOk: {
    color: '#FFFFFF',
  },
});