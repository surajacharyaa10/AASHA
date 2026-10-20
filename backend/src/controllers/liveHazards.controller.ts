import { Request, Response } from 'express';
import { redisClient } from '../config/redis';

// USGS earthquake feed (free, no API key). Proxied server-side so the browser
// never hits a third-party URL directly (avoids CORS and rate-limit failures).
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson';
const NEPAL_CENTER = { lat: 28.3949, lng: 84.124 };
const RADIUS_KM = 500;
const CACHE_TTL_SECONDS = 300; // 5 minutes

interface UsgsFeature {
  id?: string;
  properties?: {
    mag?: number;
    place?: string;
    time?: number;
    type?: string;
    alert?: string | null;
    status?: string;
    sig?: number;
  };
  geometry?: {
    coordinates?: [number, number, number];
  };
}

interface NormalizedHazard {
  id: string;
  headline: string;
  severity: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  time: string;
  type: string;
  magnitude: number;
  source: 'USGS';
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function severityFromAlert(alert: string | null | undefined, mag: number): string {
  if (alert === 'red') return 'Red';
  if (alert === 'orange') return 'Orange';
  if (alert === 'yellow') return 'Yellow';
  if (mag >= 5) return 'Orange';
  if (mag >= 4) return 'Yellow';
  return 'Green';
}

export const getLiveHazards = async (req: Request, res: Response) => {
  const cacheKey = `live-hazards:${NEPAL_CENTER.lat}:${NEPAL_CENTER.lng}:${RADIUS_KM}`;

  // Serve from cache
  if (redisClient) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
    } catch (cacheErr) {
      console.error('Live hazards cache read failed:', cacheErr);
    }
  }

  try {
    const url = `${USGS_URL}&latitude=${NEPAL_CENTER.lat}&longitude=${NEPAL_CENTER.lng}` +
      `&maxradiuskm=${RADIUS_KM}&orderby=time-asc&limit=200`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `USGS feed error: HTTP ${response.status}`,
        hazards: [],
      });
    }

    const data = await response.json() as { features?: UsgsFeature[] };
    const features = Array.isArray(data?.features) ? data.features : [];

    const hazards: NormalizedHazard[] = features
      .map((f) => {
        const coords = f.geometry?.coordinates;
        if (!coords || coords.length < 2) return null;
        const [lng, lat] = coords;
        const props = f.properties || {};
        const mag = typeof props.mag === 'number' ? props.mag : 0;
        const distanceKm = haversineKm(NEPAL_CENTER.lat, NEPAL_CENTER.lng, lat, lng);

        return {
          id: f.id || `usgs-${lng}-${lat}-${props.time || ''}`,
          headline: props.place || `${mag} ${props.type || 'event'}`,
          severity: severityFromAlert(props.alert, mag),
          latitude: lat,
          longitude: lng,
          distance_km: Math.round(distanceKm),
          time: props.time ? new Date(props.time).toISOString() : new Date().toISOString(),
          type: props.type || 'earthquake',
          magnitude: mag,
          source: 'USGS' as const,
        };
      })
      .filter((h): h is NormalizedHazard => h !== null)
      .sort((a, b) => b.magnitude - a.magnitude);

    const payload = { hazards, count: hazards.length };

    // Write through cache
    if (redisClient) {
      try {
        await redisClient.set(cacheKey, JSON.stringify(payload), 'EX', CACHE_TTL_SECONDS);
      } catch (cacheErr) {
        console.error('Live hazards cache write failed:', cacheErr);
      }
    }

    res.json(payload);
  } catch (error) {
    console.error('Failed to fetch live hazards:', error);
    res.status(500).json({ error: 'Failed to fetch live hazards', hazards: [] });
  }
};