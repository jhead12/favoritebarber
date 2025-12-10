export type Coords = { latitude: number; longitude: number };
const KEY = 'ryb:lastLocation';

export function cacheLocation(c: Coords) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
}

export function getCachedLocation(): Coords | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch (e) { return null; }
}

export function requestLocation(timeout = 10000): Promise<Coords> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new Error('Geolocation not available'));
    }
    const onSuccess = (pos: GeolocationPosition) => {
      const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      try { cacheLocation(coords); } catch (e) {}
      resolve(coords);
    };
    const onError = (err: GeolocationPositionError) => reject(err);
    const id = navigator.geolocation.getCurrentPosition(onSuccess, onError, { maximumAge: 60_000, timeout });
    // no cleanup required here; caller may ignore
  });
}

// Optional reverse geocode via OpenStreetMap Nominatim (client-side)
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Prefer server-side geocoding via `/api/geocode` so the Google API key can remain secret.
  try {
    if (typeof window === 'undefined') {
      return null;
    }
    const base = '';
    const url = new URL(`/api/geocode?lat=${encodeURIComponent(String(lat))}&lon=${encodeURIComponent(String(lon))}`, window.location.origin || base || window.location.href);
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const j = await res.json();
    return j && j.address ? j.address : null;
  } catch (e) {
    return null;
  }
}
