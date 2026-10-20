import { Request, Response as ExpressResponse } from 'express';

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';
const GEOAPIFY_PLACES_URL = 'https://api.geoapify.com/v2/places';

const CATEGORIES = [
  'healthcare.hospital',
  'healthcare.clinic_or_praxis',
  'service.social_facility.shelter',
  'activity.community_center',
  'emergency.assembly_point',
  'leisure.park',
  'sport.pitch',
  'sport.stadium',
];

const NEPAL_RECT = 'rect:80.05,30.45,88.20,26.35';
const PAGE_LIMIT = 500;
const CACHE_TTL_MS = 10 * 60 * 1000;

const FALLBACK_RESOURCES = [
  { id: 1, type: 'node', lat: 27.7172, lng: 85.3240, category: 'hospital', name: 'Bir Hospital', tags: { amenity: 'hospital', name: 'Bir Hospital', emergency: 'yes' } },
  { id: 2, type: 'node', lat: 27.6992, lng: 85.3243, category: 'hospital', name: 'Kathmandu Model Hospital', tags: { amenity: 'hospital', name: 'Kathmandu Model Hospital' } },
  { id: 3, type: 'node', lat: 27.7414, lng: 85.3477, category: 'hospital', name: 'Patan Hospital', tags: { amenity: 'hospital', name: 'Patan Hospital' } },
  { id: 4, type: 'node', lat: 27.6734, lng: 85.4308, category: 'shelter', name: 'Bhaktapur Shelter', tags: { amenity: 'shelter' } },
  { id: 5, type: 'node', lat: 27.7100, lng: 85.3200, category: 'clinic', name: 'Community Health Clinic', tags: { amenity: 'clinic' } },
  { id: 6, type: 'node', lat: 28.2060, lng: 84.0000, category: 'hospital', name: 'Pokhara Regional Hospital', tags: { amenity: 'hospital', name: 'Pokhara Regional Hospital' } },
  { id: 7, type: 'node', lat: 27.7000, lng: 85.3000, category: 'park', name: 'Tundikhel Park', tags: { leisure: 'park', name: 'Tundikhel' } },
  { id: 8, type: 'node', lat: 28.1000, lng: 84.4000, category: 'stadium', name: 'Pokhara Stadium', tags: { leisure: 'stadium' } },
];

interface CacheEntry {
  data: {
    elements: Array<{
      id: string | number;
      type: string;
      lat: number;
      lng: number;
      category: string;
      name: string;
      tags: Record<string, string | undefined>;
    }>;
    fallback: boolean;
  };
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCacheKey() {
  return `nepal_resources:${CATEGORIES.join(',')}:${NEPAL_RECT}`;
}

function getCachedData(): CacheEntry['data'] | null {
  const entry = cache.get(getCacheKey());
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(getCacheKey());
    return null;
  }
  return entry.data;
}

function setCachedData(data: CacheEntry['data']) {
  cache.set(getCacheKey(), {
    data,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

function geoapifyCategoryToCategory(categories: string[]): string {
  for (const cat of categories) {
    if (cat.includes('hospital')) return 'hospital';
    if (cat.includes('clinic')) return 'clinic';
    if (cat.includes('shelter')) return 'shelter';
    if (cat.includes('community_center')) return 'community_centre';
    if (cat.includes('assembly_point')) return 'assembly_point';
    if (cat.includes('park')) return 'park';
    if (cat.includes('pitch')) return 'pitch';
    if (cat.includes('stadium')) return 'stadium';
  }
  return 'other';
}

interface GeoapifyFeature {
  properties: {
    place_id?: string | number;
    name?: string;
    categories?: string[];
    country_code?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
    website?: string;
    phone?: string;
    opening_hours?: string;
    [key: string]: unknown;
  };
  geometry: {
    coordinates: [number, number];
  };
}

interface GeoapifyResponse {
  features: GeoapifyFeature[];
}

async function fetchPage(offset: number): Promise<GeoapifyFeature[]> {
  const categoriesParam = CATEGORIES.join(',');
  const url =
    `${GEOAPIFY_PLACES_URL}?categories=${encodeURIComponent(categoriesParam)}` +
    `&filter=${encodeURIComponent(NEPAL_RECT)}` +
    `&limit=${PAGE_LIMIT}` +
    `&offset=${offset}` +
    `&apiKey=${encodeURIComponent(GEOAPIFY_API_KEY)}`;

  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Geoapify error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as GeoapifyResponse;
  return Array.isArray(data.features) ? data.features : [];
}

export const getNepalResources = async (req: Request, res: ExpressResponse) => {
  try {
    const cached = getCachedData();
    if (cached) {
      return res.json(cached);
    }

    if (!GEOAPIFY_API_KEY) {
      console.warn('GEOAPIFY_API_KEY not configured, using fallback data');
      return res.json({ elements: FALLBACK_RESOURCES, fallback: true });
    }

    const allFeatures: GeoapifyFeature[] = [];
    let offset = 0;

    while (true) {
      const features = await fetchPage(offset);
      if (features.length === 0) break;

      allFeatures.push(...features);

      if (features.length < PAGE_LIMIT) break;
      offset += PAGE_LIMIT;
    }

    const uniqueFeatures = new Map<string, GeoapifyFeature>();

    for (const feature of allFeatures) {
      const placeId = feature.properties?.place_id;
      if (placeId !== undefined && placeId !== null && String(placeId).trim() !== '') {
        uniqueFeatures.set(String(placeId), feature);
        continue;
      }

      const coordinates = feature.geometry?.coordinates;
      const name = feature.properties?.name || '';
      if (Array.isArray(coordinates) && coordinates.length === 2) {
        const key = `${name}|${coordinates[0]}|${coordinates[1]}`;
        uniqueFeatures.set(key, feature);
      }
    }

    const elements = Array.from(uniqueFeatures.values())
      .filter((f) => f.geometry?.coordinates?.length === 2)
      .filter((f) => f.properties?.country_code === 'np')
      .map((f, idx) => {
        const [lon, lat] = f.geometry.coordinates;
        const categories = Array.isArray(f.properties?.categories) ? f.properties.categories : [];
        const category = geoapifyCategoryToCategory(categories);
        const name = f.properties?.name || `${category} #${idx + 1}`;

        const tags: Record<string, string | undefined> = {
          name,
          categories: categories.join(';'),
        };
        if (f.properties?.address_line1) tags.address_line1 = f.properties.address_line1;
        if (f.properties?.address_line2) tags.address_line2 = f.properties.address_line2;
        if (f.properties?.city) tags.city = f.properties.city;
        if (f.properties?.state) tags.state = f.properties.state;
        if (f.properties?.country) tags.country = f.properties.country;
        if (f.properties?.postcode) tags.postcode = f.properties.postcode;
        if (f.properties?.website) tags.website = f.properties.website;
        if (f.properties?.phone) tags.phone = f.properties.phone;
        if (f.properties?.opening_hours) tags.opening_hours = f.properties.opening_hours;

        return {
          id: f.properties?.place_id ?? `${lat}-${lon}-${idx}`,
          type: 'node',
          lat,
          lng: lon,
          category,
          name,
          tags,
        };
      });

    const responseData = {
      elements,
      fallback: false,
      cached: false,
      totalRaw: allFeatures.length,
      totalUnique: elements.length,
    };

    setCachedData(responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Failed to fetch Nepal resources from Geoapify:', error);
    res.json({ elements: FALLBACK_RESOURCES, fallback: true });
  }
};
