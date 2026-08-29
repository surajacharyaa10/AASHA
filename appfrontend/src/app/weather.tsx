import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import BACKEND_URL from '@/lib/config';
import { initLocation, subscribeToLocation, DeviceLocation } from '@/lib/locationService';

export default function WeatherScreen() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    initLocation();
    const unsub = subscribeToLocation((loc) => {
      setLocation(loc);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      setLoading(true);
      setError(null);
      try {
        let query = 'Kathmandu';
        if (location && !location.loading && !location.error && location.latitude !== 0) {
           query = `${location.latitude},${location.longitude}`;
        }
        
        const res = await fetch(`${BACKEND_URL}/api/weather/current?query=${query}`);
        const data = await res.json();
        
        if (data.error) {
          setError(data.error);
        } else if (data.current) {
          setWeather(data);
        } else {
           setError('Unable to load weather');
        }
      } catch (err) {
        console.error('Failed to fetch weather:', err);
        setError('Network error');
      } finally {
        setLoading(false);
      }
    };

    // If we have a location (or error loading it), fetch weather.
    if (location && !location.loading) {
       fetchWeather();
    }
  }, [location?.loading]); // Depend on loading state to finish before fetching

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Weather</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#3b82f6" />
        ) : error ? (
           <>
             <Ionicons name="alert-circle-outline" size={60} color="#ef4444" />
             <Text style={styles.errorText}>{error}</Text>
           </>
        ) : weather ? (
          <>
            <View style={styles.weatherCard}>
               {weather.current.weather_icons?.[0] ? (
                 <Ionicons name="cloud" size={80} color="#3b82f6" /> 
               ) : (
                 <Ionicons name="partly-sunny" size={80} color="#3b82f6" />
               )}
               <Text style={styles.temp}>{weather.current.temperature}°C</Text>
               <Text style={styles.desc}>{weather.current.weather_descriptions?.[0]}</Text>
               <Text style={styles.location}>{weather.location?.name}, {weather.location?.country}</Text>
               
               <View style={styles.detailsRow}>
                 <View style={styles.detailItem}>
                   <Ionicons name="water-outline" size={24} color="#64748b" />
                   <Text style={styles.detailValue}>{weather.current.humidity}%</Text>
                   <Text style={styles.detailLabel}>Humidity</Text>
                 </View>
                 <View style={styles.detailItem}>
                   <Ionicons name="flag-outline" size={24} color="#64748b" />
                   <Text style={styles.detailValue}>{weather.current.wind_speed} km/h</Text>
                   <Text style={styles.detailLabel}>Wind</Text>
                 </View>
               </View>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  weatherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  temp: {
    fontSize: 64,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 16,
  },
  desc: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 8,
  },
  location: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 32,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 24,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  }
});
