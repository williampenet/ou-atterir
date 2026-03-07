import { supabase } from './supabase';
import { TransportMode } from '../types';

const ORS_BASE = 'https://api.openrouteservice.org/v2/isochrones';

const ORS_PROFILES: Record<string, string> = {
  cycling: 'cycling-regular',
  driving: 'driving-car',
};

const TRAIN_AVG_SPEED_KMH = 60;

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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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

export async function computeIsochroneInsees(
  lat: number,
  lng: number,
  mode: TransportMode,
  durationMinutes: number,
): Promise<string[]> {
  if (mode === 'train') {
    return computeTrainRadius(lat, lng, durationMinutes);
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

async function computeTrainRadius(
  lat: number,
  lng: number,
  durationMinutes: number,
): Promise<string[]> {
  const radiusKm = (TRAIN_AVG_SPEED_KMH * durationMinutes) / 60;
  const points = await getAllCommunePoints();

  return points
    .filter(p => haversineKm(lat, lng, p.lat, p.lng) <= radiusKm)
    .map(p => p.insee);
}
