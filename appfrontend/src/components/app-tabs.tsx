import { Tabs } from 'expo-router';
import React from 'react';
import { useColorScheme, Image } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: '#F1F5F9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'SOS',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={{ width: size || 22, height: size || 22, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="call"
        options={{
          title: 'Call',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/explore.png')}
              style={{ width: size || 22, height: size || 22, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="mesh"
        options={{
          title: 'Mesh',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/home.png')}
              style={{ width: size || 22, height: size || 22, tintColor: color }}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: 'Guide',
          tabBarIcon: ({ color, size }) => (
            <Image
              source={require('@/assets/images/tabIcons/explore.png')}
              style={{ width: size || 22, height: size || 22, tintColor: color }}
            />
          ),
        }}
      />
    </Tabs>
  );
}
