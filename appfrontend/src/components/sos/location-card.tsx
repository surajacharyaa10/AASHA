import React, { useState } from 'react';
import { View, Text, Pressable, Clipboard } from 'react-native';
import { Card } from '../ui/card';

interface LocationCardProps {
  lat?: number;
  lng?: number;
  elevation?: number | null;
  accuracy?: string;
  placeName?: string | null;
  loading?: boolean;
  error?: string | null;
}

export function LocationCard({
  lat = 0,
  lng = 0,
  elevation = null,
  accuracy = '—',
  placeName = null,
  loading = false,
  error = null,
}: LocationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (loading || error) return;
    Clipboard.setString(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Status indicator ─────────────────────────────────────────────────────
  const dotColor = error ? '#EF4444' : loading ? '#F59E0B' : '#10B981';
  const statusText = error
    ? 'GPS Error'
    : loading
    ? 'Acquiring GPS…'
    : 'GPS Location Locked';
  const statusColor = error ? '#DC2626' : loading ? '#D97706' : '#059669';

  return (
    <Card
      variant="elevated"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E8F0',
        padding: 16,
        borderRadius: 20,
        marginVertical: 6,
      }}
    >
      {/* ── Header row ────────────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: dotColor,
            }}
          />
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: statusColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {statusText}
          </Text>
        </View>

        <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748B' }}>
          {accuracy} accuracy
        </Text>
      </View>

      {/* ── Error message ─────────────────────────────────────────────── */}
      {error ? (
        <Text
          style={{
            fontSize: 12,
            color: '#DC2626',
            fontWeight: '600',
            marginBottom: 8,
            lineHeight: 18,
          }}
        >
          {error}
        </Text>
      ) : (
        <>
          {/* ── Place Name ──────────────────────────────────────────────── */}
          {placeName && (
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: '#0F172A',
                marginBottom: 12,
              }}
            >
              {placeName}
            </Text>
          )}

          {/* ── Coordinate grid ─────────────────────────────────────── */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#F8FAFC',
              borderRadius: 14,
              padding: 12,
              borderWidth: 1,
              borderColor: '#F1F5F9',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <CoordCell
              label="LATITUDE"
              value={loading ? '—' : `${lat.toFixed(5)}° N`}
            />
            <CoordCell
              label="LONGITUDE"
              value={loading ? '—' : `${lng.toFixed(5)}° E`}
            />
            <CoordCell
              label="ELEVATION"
              value={
                loading
                  ? '—'
                  : elevation !== null
                  ? `${Math.round(elevation).toLocaleString()} m`
                  : '—'
              }
            />
          </View>

          {/* ── Copy button ──────────────────────────────────────────── */}
          <Pressable
            onPress={handleCopy}
            disabled={loading}
            style={({ pressed }) => ({
              backgroundColor: pressed || loading ? '#E2E8F0' : '#F1F5F9',
              paddingVertical: 10,
              borderRadius: 12,
              alignItems: 'center',
              opacity: loading ? 0.5 : 1,
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>
              {loading
                ? 'Waiting for GPS fix…'
                : copied
                ? '✓ Coordinates Copied'
                : 'Copy GPS Coordinates'}
            </Text>
          </Pressable>
        </>
      )}
    </Card>
  );
}

// ─── Helper sub-component ─────────────────────────────────────────────────────

function CoordCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text
        style={{
          fontSize: 9,
          fontWeight: '700',
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: 2,
        }}
      >
        {label}
      </Text>
      <Text style={{ fontSize: 13, fontWeight: '800', color: '#1E293B' }}>
        {value}
      </Text>
    </View>
  );
}