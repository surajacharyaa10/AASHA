/**
 * locationService.ts
 *
 * Manages location permission requests and real-time GPS tracking.
 * Provides a subscribe/unsubscribe API so any screen can get live
 * lat/lng/altitude/accuracy without managing its own subscription.
 */

import * as Location from 'expo-location';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DeviceLocation {
  latitude: number;
  longitude: number;
  altitude: number | null;  // metres above sea level (null if unavailable)
  accuracy: number | null;  // horizontal accuracy in metres
  heading: number | null;   // degrees from true north (null if unavailable)
  placeName: string | null; // reverse-geocoded human-readable name
  loading: boolean;
  error: string | null;
}

type LocationListener = (loc: DeviceLocation) => void;

// ─── Module state ─────────────────────────────────────────────────────────────

const DEFAULT: DeviceLocation = {
  latitude: 0,
  longitude: 0,
  altitude: null,
  accuracy: null,
  heading: null,
  placeName: null,
  loading: true,
  error: null,
};

let currentLocation: DeviceLocation = { ...DEFAULT };
let subscription: Location.LocationSubscription | null = null;
let listeners: LocationListener[] = [];
let initialized = false;

// ─── Internal helpers ─────────────────────────────────────────────────────────

function notify() {
  listeners.forEach(l => l({ ...currentLocation }));
}

function setLocation(coords: Location.LocationObjectCoords) {
  currentLocation = {
    latitude:  coords.latitude,
    longitude: coords.longitude,
    altitude:  coords.altitude,
    accuracy:  coords.accuracy,
    heading:   coords.heading,
    placeName: currentLocation.placeName, // keep last known name while geocoding
    loading:   false,
    error:     null,
  };
  notify();

  // Reverse-geocode in background — update placeName when it resolves
  Location.reverseGeocodeAsync(
    { latitude: coords.latitude, longitude: coords.longitude }
  ).then(results => {
    if (!results.length) return;
    const r = results[0];
    // Build a readable name: "District, Region, Country" or whatever is available
    const parts = [
      r.name,
      r.district || r.subregion || r.city,
      r.region,
      r.country,
    ].filter(Boolean);
    const placeName = parts.length > 0 ? parts.join(', ') : null;
    if (placeName !== currentLocation.placeName) {
      currentLocation = { ...currentLocation, placeName };
      notify();
    }
  }).catch(() => { /* non-fatal */ });
}

function setError(msg: string) {
  currentLocation = {
    ...currentLocation,
    loading: false,
    error: msg,
  };
  notify();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Request location permission and start watching the device's GPS.
 * Safe to call multiple times — only initialises once.
 */
export async function initLocation(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // 1. Request foreground permission
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    setError('Location permission denied. Grant it in Settings to include your GPS in the SOS packet.');
    return;
  }

  // 2. Get a fast one-shot fix first so the UI shows something quickly
  try {
    const quick = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocation(quick.coords);
  } catch {
    // Non-fatal — continuous watch will still try
  }

  // 3. Start continuous high-accuracy watch
  try {
    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000,    // update at most every 5 s
        distanceInterval: 5,   // or when moved 5 m
      },
      (loc) => setLocation(loc.coords),
    );
  } catch (err: any) {
    setError(`GPS watch failed: ${err?.message ?? 'unknown error'}`);
  }
}

/**
 * Subscribe to live location updates.
 * The callback is called immediately with the current state, then on every update.
 * Returns an unsubscribe function.
 */
export function subscribeToLocation(callback: LocationListener): () => void {
  listeners.push(callback);
  callback({ ...currentLocation }); // immediate snapshot
  return () => {
    listeners = listeners.filter(l => l !== callback);
  };
}

/** Return the most recently known location (synchronous snapshot). */
export function getLocation(): DeviceLocation {
  return { ...currentLocation };
}

/** Stop the GPS watcher (call when app backgrounds / unmounts at root level). */
export function stopLocation(): void {
  subscription?.remove();
  subscription = null;
  initialized = false;
}

/** Format accuracy for display, e.g. "±8m" */
export function formatAccuracy(metres: number | null): string {
  if (metres === null) return '—';
  return `±${Math.round(metres)}m`;
}

/** Format altitude for display, e.g. "1340 m" */
export function formatAltitude(metres: number | null): string {
  if (metres === null) return '—';
  return `${Math.round(metres).toLocaleString()} m`;
}
