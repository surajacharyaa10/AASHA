import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card } from '../ui/card';

interface LocationCardProps {
  lat?: number;
  lng?: number;
  elevation?: number;
  accuracy?: string;
  locationName?: string;
}

export function LocationCard({
  lat = 27.6869,
  lng = 86.7314,
  elevation = 2860,
  accuracy = '±12m',
  locationName = 'Lukla East Ridge, Khumbu',
}: LocationCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#10B981',
            }}
          />

          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: '#059669',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            GPS Location Captured
          </Text>
        </View>

        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: '#64748B',
          }}
        >
          {accuracy} Accuracy
        </Text>
      </View>

      <Text
        style={{
          fontSize: 15,
          fontWeight: '800',
          color: '#0F172A',
          marginBottom: 12,
        }}
      >
        {locationName}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#F8FAFC',
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: '#F1F5F9',
          justifyContent: 'space-between',
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
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
            LATITUDE
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: '#1E293B',
            }}
          >
            {lat.toFixed(4)}° N
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
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
            LONGITUDE
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: '#1E293B',
            }}
          >
            {lng.toFixed(4)}° E
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
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
            ELEVATION
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: '800',
              color: '#1E293B',
            }}
          >
            {elevation.toLocaleString()} m
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleCopy}
        style={({ pressed }) => ({
          marginTop: 12,
          backgroundColor: pressed ? '#E2E8F0' : '#F1F5F9',
          paddingVertical: 10,
          borderRadius: 12,
          alignItems: 'center',
        })}
      >
        <Text
          style={{
            fontSize: 12,
            fontWeight: '700',
            color: '#334155',
          }}
        >
          {copied
            ? '✓ Coordinates Copied'
            : 'Copy GPS Coordinates'}
        </Text>
      </Pressable>
    </Card>
  );
}