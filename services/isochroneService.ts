import { supabase } from './supabase';
import { TransportMode } from '../types';

const ORS_BASE = 'https://api.openrouteservice.org/v2/isochrones';
const SNCF_BASE = 'https://api.sncf.com/v1/coverage/sncf/isochrones';

const ORS_PROFILES: Record<string, string> = {
  cycling: 'cycling-regular',
  driving: 'driving-car',
};

interface CommunePoint {
  insee: string;
  lat: number;
  lng: number;
}

let communePointsCache: CommunePoint[] | null = null;

async function getAllCommunePoints(): Promise<CommunePoint[]> {
  if (communePointsCache) return communePointsCache;

  const allData: CommunePoint[] = [];
  const batchSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('communes')
      .select('insee, lat, lng')
      .range(from, from + batchSize - 1);

    if (error || !data || data.length === 0) break;
    allData.push(...(data as CommunePoint[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  communePointsCache = allData;
  return communePointsCache;
}

function pointInPolygon(lng: number, lat: number, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInMultiPolygon(lng: number, lat: number, multiPolygon: number[][][][]): boolean {
  for (const polygon of multiPolygon) {
    const outerRing = polygon[0];
    if (outerRing && pointInPolygon(lng, lat, outerRing)) return true;
  }
  return false;
}

function getNextWeekdayMorning(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntilMonday = day === 0 ? 1 : day === 6 ? 2 : day >= 1 && day <= 4 ? 1 : 3;
  const target = new Date(now);
  target.setDate(target.getDate() + daysUntilMonday);
  target.setHours(8, 0, 0, 0);
  return target.toISOString().replace(/[-:]/g, '').split('.')[0];
}

export async function computeIsochroneInsees(
  lat: number,
  lng: number,
  mode: TransportMode,
  durationMinutes: number,
): Promise<string[]> {
  if (mode === 'train') {
    return computeTrainIsochrone(lat, lng, durationMinutes);
  }

  const apiKey = import.meta.env.VITE_ORS_API_KEY;
  if (!apiKey) {
    console.error('Missing VITE_ORS_API_KEY');
    return [];
  }

  const profile = ORS_PROFILES[mode];
  const rangeSeconds = durationMinutes * 60;

  const res = await fetch(`${ORS_BASE}/${profile}`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      locations: [[lng, lat]],
      range: [rangeSeconds],
      range_type: 'time',
    }),
  });

  if (!res.ok) {
    console.error('ORS isochrone error', res.status, await res.text());
    return [];
  }

  const geojson = await res.json();
  const feature = geojson?.features?.[0];
  if (!feature?.geometry?.coordinates?.length) return [];

  const rings: number[][][] = feature.geometry.type === 'Polygon'
    ? feature.geometry.coordinates
    : feature.geometry.coordinates[0] ?? [];

  const outerRing = rings[0];
  if (!outerRing?.length) return [];

  const points = await getAllCommunePoints();

  return points
    .filter(p => pointInPolygon(p.lng, p.lat, outerRing))
    .map(p => p.insee);
}

async function computeTrainIsochrone(
  lat: number,
  lng: number,
  durationMinutes: number,
): Promise<string[]> {
  const apiKey = import.meta.env.VITE_SNCF_API_KEY;
  if (!apiKey) {
    console.error('Missing VITE_SNCF_API_KEY');
    return [];
  }

  const durationSeconds = durationMinutes * 60;
  const datetime = getNextWeekdayMorning();

  const params = new URLSearchParams({
    from: `${lng};${lat}`,
    'boundary_duration[]': String(durationSeconds),
    datetime,
  });

  const res = await fetch(`${SNCF_BASE}?${params}`, {
    headers: {
      'Authorization': `Basic ${btoa(apiKey + ':')}`,
    },
  });

  if (!res.ok) {
    console.error('SNCF isochrone error', res.status, await res.text());
    return [];
  }

  const json = await res.json();
  const isochrone = json?.isochrones?.[0];
  if (!isochrone?.geojson?.coordinates?.length) return [];

  const geom = isochrone.geojson;
  const points = await getAllCommunePoints();

  if (geom.type === 'MultiPolygon') {
    return points
      .filter(p => pointInMultiPolygon(p.lng, p.lat, geom.coordinates))
      .map(p => p.insee);
  }

  const outerRing = geom.coordinates?.[0];
  if (!outerRing?.length) return [];

  return points
    .filter(p => pointInPolygon(p.lng, p.lat, outerRing))
    .map(p => p.insee);
}
