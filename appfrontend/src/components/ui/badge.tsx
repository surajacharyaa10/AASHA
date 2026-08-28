import React from 'react';
import { View, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'danger' | 'success' | 'warning' | 'info' | 'neutral';
  style?: StyleProp<ViewStyle>;
  icon?: React.ReactNode;
}

export function Badge({ label, variant = 'neutral', style, icon }: BadgeProps) {
  const getStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#DC2626',
        };
      case 'success':
        return {
          bg: '#DCFCE7',
          border: '#86EFAC',
          text: '#16A34A',
        };
      case 'warning':
        return {
          bg: '#FEF3C7',
          border: '#FCD34D',
          text: '#D97706',
        };
      case 'info':
        return {
          bg: '#E0F2FE',
          border: '#7DD3FC',
          text: '#0284C7',
        };
      default:
        return {
          bg: '#F1F5F9',
          border: '#CBD5E1',
          text: '#475569',
        };
    }
  };

  const current = getStyles();

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: current.bg, borderColor: current.border },
        style,
      ]}
    >
      {icon}
      <Text style={[styles.label, { color: current.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
