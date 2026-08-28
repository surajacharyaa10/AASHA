import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'danger' | 'warning' | 'success';
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'danger':
        return {
          backgroundColor: '#FFF1F2',
          borderColor: '#FECDD3',
        };
      case 'warning':
        return {
          backgroundColor: '#FFFBEB',
          borderColor: '#FDE68A',
        };
      case 'success':
        return {
          backgroundColor: '#ECFDF5',
          borderColor: '#A7F3D0',
        };
      case 'elevated':
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        };
      default:
        return {
          backgroundColor: '#FFFFFF',
          borderColor: '#E2E8F0',
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
});
