export interface NormalizedDisaster {
  event_id: string;
  event_type: string;
  event_name: string;
  city: string;
  state: string;
  country_code: string;
  lat: number;
  lng: number;
  date: string;
  alert_level: string;
  proximity_severity_level: string;
  details: Record<string, unknown>;
  end_date: string;
  created_time: string;
  source_event_id: string;
}

interface EonetEvent {
  id: string;
  title: string;
  categories: Array<{ id: string; title: string }>;
  geometry: Array<{ date: string; type: string; coordinates: [number, number] }>;
  source?: string;
  closed?: string | null;
}

interface EonetResponse {
  events: EonetEvent[];
}

interface GdacsFeature {
  properties: Record<string, unknown>;
  geometry?: { coordinates?: [number, number] };
}

interface GdacsResponse {
  features?: GdacsFeature[];
  Features?: GdacsFeature[];
}

interface GdacsProperties {
  eventid?: string;
  id?: string;
  episodeid?: string;
  eventtype?: string;
  eventname?: string;
  city?: string;
  location?: string;
  province?: string;
  country?: string;
  coordinates?: [number, number];
  fromdate?: string;
  todate?: string;
  pubDate?: string;
  alertlevel?: string;
  severity?: string;
}

const NEPAL_BBOX = { minLng: 80.0, minLat: 26.3, maxLng: 88.2, maxLat: 30.5 };

function insideNepal(lat: number, lng: number): boolean {
  return lat >= NEPAL_BBOX.minLat && lat <= NEPAL_BBOX.maxLat && lng >= NEPAL_BBOX.minLng && lng <= NEPAL_BBOX.maxLng;
}

const EONET_CATEGORY_MAP: Record<string, string> = {
  wildfires: 'WF',
  volcanoes: 'VO',
  severeStorms: 'SW',
  floods: 'FL',
  drought: 'DR',
  earthquakes: 'EQ',
  temperatureExtreme: 'ET',
  landslides: 'LS',
};

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

const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
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

async function fetchEonet(days: number): Promise<NormalizedDisaster[]> {
  const url = new URL('https://eonet.gsfc.nasa.gov/api/v3/events');
  url.searchParams.set('category', 'wildfires,volcanoes,severeStorms,floods,drought,earthquakes,temperatureExtreme');
  url.searchParams.set('bbox', `${NEPAL_BBOX.minLng},${NEPAL_BBOX.minLat},${NEPAL_BBOX.maxLng},${NEPAL_BBOX.maxLat}`);
  url.searchParams.set('status', 'all');
  url.searchParams.set('limit', '100');

  const res: any = await fetch(url.toString());
  if (!res.ok) throw new Error(`EONET HTTP ${res.status}`);
  const data = await res.json() as EonetResponse;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const events: NormalizedDisaster[] = [];
  for (const ev of data.events || []) {
    const geom = ev.geometry?.[0];
    if (!geom?.coordinates) continue;

    let lat: number, lng: number;
    if (geom.type === 'Point') {
      [lng, lat] = geom.coordinates as [number, number];
    } else if (geom.type === 'Polygon') {
      const ring = Array.isArray(geom.coordinates[0]) ? geom.coordinates[0] : geom.coordinates;
      const first = ring[0];
      if (!Array.isArray(first) || first.length < 2) continue;
      const [c0, c1] = [Number(first[0]), Number(first[1])];
      if (c0 >= -90 && c0 <= 90 && c1 >= -180 && c1 <= 180) {
        lat = c0; lng = c1;
      } else if (c0 >= -180 && c0 <= 180 && c1 >= -90 && c1 <= 90) {
        lng = c0; lat = c1;
      } else {
        continue;
      }
    } else {
      continue;
    }

    if (!insideNepal(lat, lng)) continue;

    const eventDate = new Date(geom.date);
    if (eventDate < cutoff) continue;

    const categoryId = ev.categories?.[0]?.id || 'misc';
    const eventType = EONET_CATEGORY_MAP[categoryId] || categoryId.slice(0, 2).toUpperCase();
    const isClosed = !!ev.closed;

    events.push({
      event_id: `EONET-${ev.id}`,
      event_type: eventType,
      event_name: ev.title || 'Unnamed Event',
      city: '',
      state: '',
      country_code: 'NPL',
      lat,
      lng,
      date: geom.date,
      alert_level: isClosed ? 'Green' : 'Orange',
      proximity_severity_level: isClosed ? 'Watch' : 'Warning',
      details: { source: 'NASA EONET', categories: (ev.categories || []).map((c: any) => c.title) },
      end_date: geom.date,
      created_time: geom.date,
      source_event_id: `EONET-${ev.id}`,
    });
  }
  return events;
}

async function fetchGdacs(days: number): Promise<NormalizedDisaster[]> {
  const url = 'https://www.gdacs.org/gdacsapi/api/Events/geteventlist/SEARCH?eventlist=TC,DR,FL,VO,EQ&country=Nepal';
  const res: any = await fetch(url);
  if (!res.ok) throw new Error(`GDACS HTTP ${res.status}`);
  const data = await res.json() as GdacsResponse;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const features = data.features || data.Features || [];
  const events: NormalizedDisaster[] = [];

  for (const feature of features) {
    const props = feature.properties as GdacsProperties;
    const coords = props.coordinates || feature.geometry?.coordinates;
    if (!coords || coords.length < 2) continue;
    const [lng, lat] = coords;
    if (!insideNepal(lat, lng)) continue;

    const eventDate = new Date(props.fromdate || props.pubDate || new Date().toISOString());
    if (eventDate < cutoff) continue;

    const eventId = props.eventid || props.id || props.episodeid || `GDACS-${events.length}`;
    events.push({
      event_id: `GDACS-${eventId}`,
      event_type: (props.eventtype || 'MISC').toUpperCase(),
      event_name: props.eventname || 'GDACS Event',
      city: props.city || props.location || '',
      state: props.province || '',
      country_code: 'NPL',
      lat,
      lng,
      date: props.fromdate || props.pubDate || new Date().toISOString(),
      alert_level: props.alertlevel || 'Unknown',
      proximity_severity_level: props.severity || props.alertlevel || 'Unknown',
      details: {
        source: 'GDACS',
        episodeid: props.episodeid,
        eventtype: props.eventtype,
        alertlevel: props.alertlevel,
        severity: props.severity,
      },
      end_date: props.todate || props.fromdate || new Date().toISOString(),
      created_time: props.pubDate || props.fromdate || new Date().toISOString(),
      source_event_id: `GDACS-${eventId}`,
    });
  }
  return events;
}

export async function fetchAllDisasters(days: number = 30): Promise<NormalizedDisaster[]> {
  const [eonet, gdacs] = await Promise.allSettled([fetchEonet(days), fetchGdacs(days)]);
  const combined: NormalizedDisaster[] = [];
  if (eonet.status === 'fulfilled') combined.push(...eonet.value);
  if (gdacs.status === 'fulfilled') combined.push(...gdacs.value);

  const seen = new Set<string>();
  const deduped: NormalizedDisaster[] = [];
  for (const ev of combined) {
    if (!seen.has(ev.source_event_id)) {
      seen.add(ev.source_event_id);
      deduped.push(ev);
    }
  }

  deduped.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return deduped;
}
