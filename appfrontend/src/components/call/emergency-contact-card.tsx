import React from 'react';
import {
  View,
  Text,
  Pressable,
  Linking,
} from 'react-native';

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  category: string;
  description: string;
  isHotline?: boolean;
  iconBg?: string;
  iconEmoji: string;
}

interface EmergencyContactCardProps {
  contact: EmergencyContact;
}

export function EmergencyContactCard({
  contact,
}: EmergencyContactCardProps) {
  const handleCall = () => {
    Linking.openURL(`tel:${contact.number}`);
  };

  return (
    <Pressable
      onPress={handleCall}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: pressed
          ? '#F8FAFC'
          : contact.isHotline
          ? '#FFF1F2'
          : '#FFFFFF',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: pressed
          ? '#E2E8F0'
          : contact.isHotline
          ? '#FECDD3'
          : '#E2E8F0',
        padding: 16,
        marginVertical: 6,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 2,
        transform: [
          {
            scale: pressed ? 0.98 : 1,
          },
        ],
      })}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          flex: 1,
          paddingRight: 8,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: contact.iconBg || '#F1F5F9',
          }}
        >
          <Text
            style={{
              fontSize: 22,
            }}
          >
            {contact.iconEmoji}
          </Text>
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: '#0F172A',
              }}
            >
              {contact.name}
            </Text>

            {contact.isHotline && (
              <View
                style={{
                  backgroundColor: '#E11D48',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: '800',
                    color: '#FFFFFF',
                    letterSpacing: 0.5,
                  }}
                >
                  24/7 TOLL-FREE
                </Text>
              </View>
            )}
          </View>

          <Text
            style={{
              fontSize: 12,
              color: '#475569',
              marginTop: 2,
              fontWeight: '500',
            }}
          >
            {contact.description}
          </Text>

          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#94A3B8',
              textTransform: 'uppercase',
              marginTop: 4,
              letterSpacing: 0.5,
            }}
          >
            {contact.category}
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: '#0F172A',
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 14,
          alignItems: 'center',
          minWidth: 80,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '900',
            color: '#FFFFFF',
          }}
        >
          {contact.number}
        </Text>

        <Text
          style={{
            fontSize: 8,
            fontWeight: '800',
            color: '#94A3B8',
            marginTop: 2,
            letterSpacing: 0.5,
          }}
        >
          TAP TO CALL
        </Text>
      </View>
    </Pressable>
  );
}