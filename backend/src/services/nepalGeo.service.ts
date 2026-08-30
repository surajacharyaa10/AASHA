import fs from 'fs';
import path from 'path';
import { connectDB } from '../config/database';

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

const FALLBACK_DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  Bhojpur: { lat: 27.18, lng: 87.05 },
  Dhankuta: { lat: 26.98, lng: 87.35 },
  Ilam: { lat: 26.92, lng: 87.92 },
  Jhapa: { lat: 26.72, lng: 88.00 },
  Khotang: { lat: 27.22, lng: 86.78 },
  Morang: { lat: 26.70, lng: 87.42 },
  Okhaldhunga: { lat: 27.32, lng: 86.63 },
  Panchthar: { lat: 27.12, lng: 87.72 },
  Sankhuwasabha: { lat: 27.52, lng: 87.25 },
  Solukhumbu: { lat: 27.60, lng: 86.73 },
  Sunsari: { lat: 26.65, lng: 87.55 },
  Taplejung: { lat: 27.35, lng: 87.67 },
  Terhathum: { lat: 27.22, lng: 87.58 },
  Udayapur: { lat: 26.88, lng: 86.72 },
  Bara: { lat: 27.08, lng: 85.00 },
  Dhanusha: { lat: 26.88, lng: 86.08 },
  Mahottari: { lat: 26.72, lng: 85.83 },
  Parsa: { lat: 27.28, lng: 84.88 },
  Rautahat: { lat: 27.08, lng: 85.32 },
  Saptari: { lat: 26.65, lng: 86.75 },
  Sarlahi: { lat: 26.98, lng: 85.55 },
  Siraha: { lat: 26.72, lng: 86.22 },
  Bhaktapur: { lat: 27.68, lng: 85.43 },
  Chitwan: { lat: 27.72, lng: 84.42 },
  Dhading: { lat: 28.08, lng: 85.08 },
  Dolakha: { lat: 27.72, lng: 86.18 },
  Kathmandu: { lat: 27.72, lng: 85.32 },
  Kavrepalanchok: { lat: 27.62, lng: 85.58 },
  Lalitpur: { lat: 27.67, lng: 85.33 },
  Makwanpur: { lat: 27.48, lng: 85.15 },
  Nuwakot: { lat: 27.95, lng: 85.22 },
  Ramechhap: { lat: 27.35, lng: 86.08 },
  Rasuwa: { lat: 28.18, lng: 85.28 },
  Sindhuli: { lat: 27.25, lng: 85.88 },
  Sindhupalchok: { lat: 27.85, lng: 85.58 },
  Baglung: { lat: 28.22, lng: 83.62 },
  Gorkha: { lat: 28.00, lng: 84.63 },
  Kaski: { lat: 28.22, lng: 83.98 },
  Lamjung: { lat: 28.25, lng: 84.38 },
  Manang: { lat: 28.68, lng: 84.02 },
  Mustang: { lat: 29.18, lng: 83.95 },
  Myagdi: { lat: 28.52, lng: 83.38 },
  Nawalpur: { lat: 27.85, lng: 83.78 },
  Parbat: { lat: 28.22, lng: 83.68 },
  Syangja: { lat: 28.18, lng: 83.88 },
  Tanahun: { lat: 28.08, lng: 84.25 },
  Arghakhanchi: { lat: 27.98, lng: 83.25 },
  Banke: { lat: 28.08, lng: 81.62 },
  Bardiya: { lat: 28.32, lng: 81.42 },
  Dang: { lat: 28.02, lng: 82.42 },
  Gulmi: { lat: 28.08, lng: 83.28 },
  Kapilvastu: { lat: 27.58, lng: 83.05 },
  Parasi: { lat: 27.58, lng: 83.68 },
  Palpa: { lat: 27.88, lng: 83.58 },
  Pyuthan: { lat: 28.12, lng: 82.88 },
  Rolpa: { lat: 28.42, lng: 82.65 },
  RukumEast: { lat: 28.72, lng: 82.42 },
  Rupandehi: { lat: 27.52, lng: 83.48 },
  Dailekh: { lat: 28.82, lng: 81.72 },
  Dolpa: { lat: 29.02, lng: 82.98 },
  Humla: { lat: 29.92, lng: 81.85 },
  Jajarkot: { lat: 28.72, lng: 82.42 },
  Jumla: { lat: 29.28, lng: 82.18 },
  Kalikot: { lat: 29.18, lng: 81.92 },
  Mugu: { lat: 29.52, lng: 82.22 },
  RukumWest: { lat: 28.68, lng: 82.22 },
  Salyan: { lat: 28.42, lng: 82.18 },
  Surkhet: { lat: 28.58, lng: 81.62 },
  Achham: { lat: 29.08, lng: 81.28 },
  Baitadi: { lat: 29.52, lng: 80.55 },
  Bajhang: { lat: 29.58, lng: 81.22 },
  Bajura: { lat: 29.48, lng: 81.58 },
  Dadeldhura: { lat: 29.28, lng: 80.58 },
  Darchula: { lat: 29.88, lng: 80.52 },
  Doti: { lat: 29.28, lng: 80.98 },
  Kailali: { lat: 28.72, lng: 80.92 },
  Kanchanpur: { lat: 28.88, lng: 80.28 },
};

let DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = { ...FALLBACK_DISTRICT_COORDS };

try {
  const filePath = path.join(__dirname, '../../../../nepal_place.json');
  if (fs.existsSync(filePath)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const geojson = JSON.parse(raw);
    const sums: Record<string, { lat: number; lng: number; n: number }> = {};
    for (const feature of geojson.features || []) {
      const county = feature.properties?.county;
      const lat = feature.properties?.lat;
      const lng = feature.properties?.lon;
      if (!county || typeof lat !== 'number' || typeof lng !== 'number') continue;
      if (!sums[county]) sums[county] = { lat: 0, lng: 0, n: 0 };
      sums[county].lat += lat;
      sums[county].lng += lng;
      sums[county].n += 1;
    }
    for (const [name, s] of Object.entries(sums)) {
      DISTRICT_COORDS[name] = { lat: s.lat / s.n, lng: s.lng / s.n };
    }
  }
} catch (err) {
  console.warn('Failed to load nepal_place.json for district centroids:', err);
}

export function findNearestDistrict(lat: number, lng: number): string | null {
  let nearest = '';
  let minDist = Infinity;
  for (const [district, coords] of Object.entries(DISTRICT_COORDS)) {
    const dist = haversineKm(lat, lng, coords.lat, coords.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = district;
    }
  }
  return nearest || null;
}
