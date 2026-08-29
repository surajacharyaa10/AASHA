import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RoutingMode } from '@/lib/sosService';

interface MeshStatusBannerProps {
  peerCount?:    number;
  isRelayActive?: boolean;
  batteryPercent?: number;
  isGateway?:    boolean;
  routingMode?:  RoutingMode;
  uploadedByHop?: number | null;
}

export function MeshStatusBanner({
  peerCount     = 0,
  isRelayActive = false,
  batteryPercent = 78,
  isGateway     = false,
  routingMode   = 'idle',
  uploadedByHop = null,
}: MeshStatusBannerProps) {

  // ── Connectivity label ────────────────────────────────────────────────────
  let connectLabel: string;
  let connectStyle: object;

  if (routingMode === 'direct') {
    connectLabel = '🌐 Direct to Server';
    connectStyle = styles.connectDirect;
  } else if (routingMode === 'ble_mesh') {
    if (uploadedByHop !== null) {
      connectLabel = `✅ Uploaded via Hop ${uploadedByHop}`;
      connectStyle = styles.connectUploaded;
    } else {
      connectLabel = `🔵 BLE Hopping…`;
      connectStyle = styles.connectBle;
    }
  } else {
    // idle
    connectLabel = isGateway ? '🌐 Online · Ready' : '📡 Offline · BLE Mesh';
    connectStyle = isGateway ? styles.connectDirect : styles.connectOffline;
  }

  return (
    <View style={styles.container}>

      {/* BLE Mesh node status */}
      <View style={styles.item}>
        <View style={styles.dotRow}>
          <View style={[styles.dot, isRelayActive && styles.dotActive]} />
          <Text style={styles.label}>MESH PEERS</Text>
        </View>
        <Text style={styles.value}>
          {isRelayActive ? `${peerCount} Visible` : 'Scanning…'}
        </Text>
      </View>

      <View style={styles.divider} />

      {/* Routing mode / connectivity */}
      <View style={styles.item}>
        <Text style={styles.label}>ROUTING</Text>
        <Text style={[styles.value, connectStyle]}>{connectLabel}</Text>
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
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
    textAlign: 'center',
  },
  connectDirect: {
    color: '#38BDF8',   // sky blue — online direct
  },
  connectBle: {
    color: '#FCD34D',   // amber — hopping
  },
  connectUploaded: {
    color: '#4ADE80',   // green — confirmed uploaded via mesh
  },
  connectOffline: {
    color: '#94A3B8',   // grey — idle offline
  },
  batteryLow: {
    color: '#F87171',
  },
  batteryOk: {
    color: '#FFFFFF',
  },
});