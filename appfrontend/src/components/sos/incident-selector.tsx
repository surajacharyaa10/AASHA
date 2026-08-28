import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from 'react-native';

export type IncidentCategory =
  | 'medical'
  | 'avalanche'
  | 'trauma'
  | 'lost'
  | 'flood'
  | 'earthquake';

interface CategoryOption {
  id: IncidentCategory;
  label: string;
  emoji: string;
  sub: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'medical',
    label: 'Altitude / AMS',
    emoji: '🏔️',
    sub: 'HAPE / Illness',
  },
  {
    id: 'avalanche',
    label: 'Avalanche',
    emoji: '❄️',
    sub: 'Crevasse Fall',
  },
  {
    id: 'trauma',
    label: 'Trauma & Fall',
    emoji: '🚑',
    sub: 'Fracture / Injury',
  },
  {
    id: 'lost',
    label: 'Lost / Trapped',
    emoji: '🧭',
    sub: 'Zero Visibility',
  },
  {
    id: 'flood',
    label: 'Flash Flood',
    emoji: '🌊',
    sub: 'Swiftwater',
  },
  {
    id: 'earthquake',
    label: 'Collapse',
    emoji: '⚠️',
    sub: 'Building / Landslide',
  },
];

interface IncidentSelectorProps {
  selected: IncidentCategory;
  onSelect: (category: IncidentCategory) => void;
  disabled?: boolean;
}

export function IncidentSelector({
  selected,
  onSelect,
  disabled = false,
}: IncidentSelectorProps) {
  return (
    <View
      style={{
        marginVertical: 12,
        width: '100%',
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: '800',
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 8,
          paddingHorizontal: 4,
        }}
      >
        Select Emergency Category
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 8,
          paddingHorizontal: 2,
          paddingBottom: 4,
        }}
      >
        {CATEGORIES.map((cat) => {
          const isSelected = selected === cat.id;

          return (
            <Pressable
              key={cat.id}
              disabled={disabled}
              onPress={() => onSelect(cat.id)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 16,
                backgroundColor: isSelected
                  ? '#0F172A'
                  : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isSelected
                  ? '#0F172A'
                  : '#E2E8F0',
                minWidth: 110,
                alignItems: 'center',
                opacity: disabled ? 0.6 : 1,
                shadowColor: isSelected
                  ? '#0F172A'
                  : 'transparent',
                shadowOffset: {
                  width: 0,
                  height: 4,
                },
                shadowOpacity: isSelected ? 0.15 : 0,
                shadowRadius: 8,
                elevation: isSelected ? 3 : 0,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  marginBottom: 4,
                }}
              >
                {cat.emoji}
              </Text>

              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: isSelected
                    ? '#FFFFFF'
                    : '#1E293B',
                  textAlign: 'center',
                }}
              >
                {cat.label}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: isSelected
                    ? '#CBD5E1'
                    : '#94A3B8',
                  marginTop: 2,
                  textAlign: 'center',
                }}
              >
                {cat.sub}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}