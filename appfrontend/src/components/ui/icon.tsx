import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  fallbackText?: string;
}

const SYMBOL_MAP: Record<string, SymbolViewProps['name']> = {
  sos: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  mesh: { ios: 'antenna.radiowaves.left.and.right', android: 'wifi', web: 'wifi' },
  profile: { ios: 'person.crop.circle.fill', android: 'person', web: 'person' },
  shield: { ios: 'shield.lefthalf.filled', android: 'shield', web: 'shield' },
  battery: { ios: 'battery.75percent', android: 'battery_full', web: 'battery_full' },
  location: { ios: 'location.fill', android: 'location_on', web: 'location_on' },
  copy: { ios: 'doc.on.doc.fill', android: 'content_copy', web: 'content_copy' },
  check: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' },
  alert: { ios: 'exclamationmark.octagon.fill', android: 'error', web: 'error' },
  medical: { ios: 'cross.case.fill', android: 'medical_services', web: 'medical_services' },
  mountain: { ios: 'mountain.2.fill', android: 'terrain', web: 'terrain' },
  radio: { ios: 'dot.radiowaves.left.and.right', android: 'radio', web: 'radio' },
  info: { ios: 'info.circle.fill', android: 'info', web: 'info' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  notification: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  share: { ios: 'square.and.arrow.up.fill', android: 'share', web: 'share' },
};

export function Icon({ name, size = 20, color = '#ffffff', fallbackText }: IconProps) {
  const symbolDef = SYMBOL_MAP[name] || { ios: 'info.circle', android: 'info', web: 'info' };

  try {
    return (
      <SymbolView
        name={symbolDef}
        size={size}
        tintColor={color}
        style={{ width: size, height: size }}
      />
    );
  } catch {
    return (
      <View style={[styles.fallback, { width: size, height: size }]}>
        <Text style={[styles.fallbackText, { fontSize: size * 0.6, color }]}>
          {fallbackText || '●'}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontWeight: 'bold',
  },
});
