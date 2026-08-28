import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  EmergencyContactCard,
  EmergencyContact,
} from '@/components/call/emergency-contact-card';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const NATIONAL_HOTLINES: EmergencyContact[] = [
  {
    id: '1149',
    name: 'National Disaster Hotline (NEOC)',
    number: '1149',
    category: 'Disaster Management',
    description:
      'National Emergency Operation Centre — earthquakes, floods, landslides & all-hazard coordination. NDRRMA.',
    isHotline: true,
    iconEmoji: '🌊',
    iconBg: '#FEE2E2',
  },
  {
    id: '112',
    name: 'National Emergency Response',
    number: '112',
    category: 'All-Hazards Emergency Service',
    description:
      'Unified disaster, trauma, and search dispatch hotline. ⚠️ May not reliably connect on all Nepali carriers — fall back to 100 or 1149.',
    isHotline: true,
    iconEmoji: '🚨',
    iconBg: '#FFE4E6',
  },
  {
    id: '100',
    name: 'Nepal Police',
    number: '100',
    category: 'Security & Rapid Response',
    description:
      'Direct central police control room and patrol dispatch.',
    iconEmoji: '👮',
    iconBg: '#E0F2FE',
  },
  {
    id: '102',
    name: 'Emergency Ambulance & Air Evac',
    number: '102',
    category: 'Medical Services',
    description:
      'Critical trauma care, altitude sickness medical transport.',
    iconEmoji: '🚑',
    iconBg: '#DCFCE7',
  },
  {
    id: '101',
    name: 'Fire & Extrication Rescue',
    number: '101',
    category: 'Fire / Structural Collapse',
    description:
      'Heavy rescue, building collapse & flash flood relief.',
    iconEmoji: '🚒',
    iconBg: '#FEF3C7',
  },
  {
    id: '1144',
    name: 'Himalayan Rescue & Tourist Police',
    number: '1144',
    category: 'High Altitude Mountain Rescue',
    description:
      'Heli-evacuation coordination for Everest & Annapurna trails.',
    isHotline: true,
    iconEmoji: '🏔️',
    iconBg: '#F3E8FF',
  },
  {
    id: '1155',
    name: 'Nepal Police Public Helpline',
    number: '1155',
    category: 'Public Assistance',
    description:
      'Toll-free public helpline for non-emergency police inquiries, missing persons, and general assistance.',
    isHotline: true,
    iconEmoji: '📞',
    iconBg: '#ECFDF5',
  },
  {
    id: '103',
    name: 'Traffic Police',
    number: '103',
    category: 'Road & Highway Incidents',
    description:
      'Road blockage, highway incidents, and traffic-related emergencies.',
    iconEmoji: '🚦',
    iconBg: '#F0F9FF',
  },
];   

export default function EmergencyCallScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const [customNumber, setCustomNumber] = useState('');

  const handleCustomCall = () => {
    if (customNumber.trim()) {
      Linking.openURL(`tel:${customNumber.trim()}`);
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#F8FAFC',
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 8,
          paddingBottom:
            safeAreaInsets.bottom +
            BottomTabInset +
            Spacing.six,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: MaxContentWidth,
          }}
        >
          {/* Header */}
          <View
            style={{
              marginBottom: 14,
              paddingHorizontal: 4,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '900',
                  color: '#0F172A',
                }}
              >
                Emergency Lines
              </Text>

              <Badge label="24/7 HOTLINES" variant="success" />
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: '#64748B',
                marginTop: 2,
              }}
            >
              Direct 1-tap connection to national dispatch & local rescue bases
            </Text>
          </View>

          {/* Custom Dialer */}
          <Card
            variant="elevated"
            style={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              padding: 16,
              borderRadius: 20,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontWeight: '800',
                color: '#64748B',
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              QUICK DIRECT DIALER
            </Text>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <TextInput
                value={customNumber}
                onChangeText={setCustomNumber}
                placeholder="Enter phone number or frequency..."
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                style={{
                  flex: 1,
                  backgroundColor: '#F8FAFC',
                  borderWidth: 1,
                  borderColor: '#CBD5E1',
                  borderRadius: 14,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: '#0F172A',
                  fontWeight: '600',
                }}
              />

              <Pressable
                onPress={handleCustomCall}
                style={({ pressed }) => ({
                  backgroundColor: pressed ? '#1E293B' : '#0F172A',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '900',
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                  }}
                >
                  CALL
                </Text>
              </Pressable>
            </View>
          </Card>

          {/* National Emergency Services */}
          <View
            style={{
              marginTop: 12,
              marginBottom: 8,
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: '#0F172A',
                paddingHorizontal: 4,
              }}
            >
              National Emergency Services
            </Text>

            <Text
              style={{
                fontSize: 11,
                color: '#64748B',
                fontWeight: '500',
                marginTop: 2,
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              Toll-free emergency numbers accessible with or without SIM card balance
            </Text>

            {NATIONAL_HOTLINES.map((c) => (
              <EmergencyContactCard key={c.id} contact={c} />
            ))}
          </View>

      
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}