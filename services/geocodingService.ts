const BASE_URL = 'https://api-adresse.data.gouv.fr';

export interface GeocodingResult {
  label: string;
  lat: number;
  lng: number;
  city: string;
  postcode: string;
}

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  const params = new URLSearchParams({ q: trimmed, limit: '5', autocomplete: '1' });
  const res = await fetch(`${BASE_URL}/search/?${params}`);
  if (!res.ok) return [];

  const json = await res.json();

  return (json.features || []).map((f: {
    properties: { label: string; city: string; postcode: string };
    geometry: { coordinates: [number, number] };
  }) => ({
    label: f.properties.label,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    city: f.properties.city,
    postcode: f.properties.postcode,
  }));
}
