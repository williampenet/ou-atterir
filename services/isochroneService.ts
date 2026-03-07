import { supabase } from './supabase';
import { TransportMode } from '../types';

const ORS_BASE = 'https://api.openrouteservice.org/v2/isochrones';
const SNCF_BASE = 'https://api.sncf.com/v1/coverage/sncf/isochrones';

const ORS_PROFILES: Record<string, string> = {
  cycling: 'cycling-regular',
  driving: 'driving-car',
};

const STATION_CATCHMENT_KM = 10;

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function extractCentroids(geom: { type: string; coordinates: number[][][][] | number[][][] }): { lat: number; lng: number }[] {
  const polygons: number[][][][] = geom.type === 'MultiPolygon'
    ? (geom.coordinates as number[][][][])
    : [geom.coordinates as number[][][]];

  return polygons.map(polygon => {
    const ring = polygon[0];
    if (!ring?.length) return { lat: 0, lng: 0 };
    let sumLng = 0, sumLat = 0;
    for (const [lng, lat] of ring) {
      sumLng += lng;
      sumLat += lat;
    }
    return { lng: sumLng / ring.length, lat: sumLat / ring.length };
  }).filter(c => c.lat !== 0 || c.lng !== 0);
}

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

async function findNearestSncfStop(
  lat: number,
  lng: number,
  apiKey: string,
): Promise<string | null> {
  const url = `https://api.sncf.com/v1/coverage/sncf/coord/${lng};${lat}/places_nearby?type[]=stop_area&count=1&distance=50000`;

  const res = await fetch(url, {
    headers: { 'Authorization': `Basic ${btoa(apiKey + ':')}` },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return json?.places_nearby?.[0]?.id ?? null;
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

  const stopId = await findNearestSncfStop(lat, lng, apiKey);
  if (!stopId) {
    console.error('No SNCF stop found near coordinates');
    return [];
  }

  const durationSeconds = durationMinutes * 60;
  const datetime = getNextWeekdayMorning();

  const params = new URLSearchParams({
    from: stopId,
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
  const stationCentroids = extractCentroids(geom);

  const matched = points.filter(p =>
    stationCentroids.some(c => haversineKm(p.lat, p.lng, c.lat, c.lng) <= STATION_CATCHMENT_KM)
  );

  return matched.map(p => p.insee);
}
