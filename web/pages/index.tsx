import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import dynamic from 'next/dynamic';
const AdminReconciler = dynamic(() => import('../components/AdminReconciler'), { ssr: false, loading: () => null });
import { mapApiBarberToUi, UiBarber } from '../lib/adapters';
import { saveLocation, loadLocation } from '../lib/location';

const MOCK_SHOPS = [
  {
    id: 'shop1',
    name: 'Mission Cuts',
    shop: '123 Mission St, SF',
    distance: '0.4 mi',
    trust: 92,
    specialties: ['Fade', 'Beard trim', 'Hot towel shave'],
    price: '$$',
    thumb: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=60',
    entityType: 'shop',
  },
  {
    id: 'shop2',
    name: 'SoMa Barber Co.',
    shop: '456 Howard St, SF',
    distance: '1.1 mi',
    trust: 85,
    specialties: ['Taper', 'Textured crop', 'Pompadour'],
    price: '$$',
    thumb: 'https://images.unsplash.com/photo-1503951914909-04e7d77c5cde?auto=format&fit=crop&w=400&q=60',
    entityType: 'shop',
  },
  {
    id: 'shop3',
    name: 'Castro Clippers',
    shop: '789 Castro St, SF',
    distance: '2.3 mi',
    trust: 77,
    specialties: ['Buzz', 'Crew', 'Line-up'],
    price: '$$',
    thumb: 'https://images.unsplash.com/photo-1503951914646-5700dea92f62?auto=format&fit=crop&w=400&q=60',
    entityType: 'shop',
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [results, setResults] = useState<UiBarber[]>(MOCK_SHOPS as unknown as UiBarber[]);
  const [latestPositive, setLatestPositive] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const fetchLatest = async (lat: number, lon: number) => {
      try {
        const url = new URL('/api/reviews/most-recent-positive', apiBase);
        url.searchParams.set('latitude', String(lat));
        url.searchParams.set('longitude', String(lon));
        url.searchParams.set('radius_miles', '20');
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data && data.found) setLatestPositive(data);
      } catch (e) {
        // ignore
      }
    };

    // Fetch nearby shops: prefer local DB `/api/search`, fallback to Yelp cached search.
    const fetchNearbyShops = async (lat: number, lon: number) => {
      // Try local DB search first (faster and avoids external API when populated)
      try {
        const localUrl = new URL('/api/search', apiBase);
        localUrl.searchParams.set('latitude', String(lat));
        localUrl.searchParams.set('longitude', String(lon));
        const localRes = await fetch(localUrl.toString());
        if (localRes.ok) {
          const localData = await localRes.json();
          if (cancelled) return;
          if (Array.isArray(localData) && localData.length > 0) {
            const mappedLocal = localData.map((shop: any) => {
              // support several shapes returned by server (yelp cache vs internal shops)
              const addr = shop.address || (shop.primary_location && shop.primary_location.formatted_address) || '';
              const distance_m = shop.distance_m || (shop.distance_m === 0 ? 0 : shop.distance || 0);
              const trustScore = (shop.trust_score && (shop.trust_score.value || shop.trust_score)) || shop.trust_score || (shop.rating ? Math.round((shop.rating / 5) * 100) : 0);
              const thumb = shop.thumbnail_url || shop.image_url || (shop.images && shop.images.length ? shop.images[0] : '') || '';
              const categories = shop.top_tags || (shop.raw && (shop.raw.categories || shop.raw.tags)) || shop.categories || [];
              return {
                id: shop.id,
                name: shop.name || '',
                shop: addr,
                distance: distance_m ? `${(Number(distance_m) / 1609.34).toFixed(1)} mi` : '',
                trust: typeof trustScore === 'object' && trustScore.value ? Math.round(trustScore.value) : Math.round(Number(trustScore) || 0),
                specialties: Array.isArray(categories) ? categories.slice(0,3).map((c: any) => (typeof c === 'string' ? c : (c.title || c.name || ''))).filter(Boolean) : [],
                price: shop.price || '$$',
                thumb,
                entityType: 'shop',
              };
            });
            setResults(mappedLocal as unknown as UiBarber[]);
            return;
          }
        }
      } catch (e) {
        console.warn('local fetchNearbyShops failed, falling back to Yelp cached search', e);
      }

      // Fallback: Yelp cached search (existing behavior)
      try {
        const url = new URL('/api/yelp-cached-search', apiBase);
        url.searchParams.set('latitude', String(lat));
        url.searchParams.set('longitude', String(lon));
        url.searchParams.set('radius_m', '5000');
        url.searchParams.set('term', 'barber');
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const mapped = data.results.map((shop: any) => {
            const priceRange = shop.price || (shop.raw && shop.raw.price) || '$$';
            let categories: string[] = [];
            if (Array.isArray(shop.categories)) {
              categories = shop.categories.map((c: any) => typeof c === 'string' ? c : (c.title || c.name || '')).filter(Boolean);
            } else if (shop.raw && Array.isArray(shop.raw.categories)) {
              categories = shop.raw.categories.map((c: any) => c.title || c.name || '').filter(Boolean);
            }
            return {
              id: shop.id,
              name: shop.name || '',
              shop: shop.address || (shop.location && shop.location.display_address ? (shop.location.display_address || []).join(', ') : ''),
              distance: shop.distance_m ? `${(shop.distance_m / 1609.34).toFixed(1)} mi` : '',
              trust: shop.rating ? Math.round((shop.rating / 5) * 100) : (shop.review_count ? 75 : 0),
              specialties: categories.slice(0,3),
              price: priceRange,
              thumb: shop.image_url || (shop.raw && shop.raw.image_url) || '',
              entityType: 'shop',
            };
          });
          setResults(mapped as unknown as UiBarber[]);
        }
      } catch (e) {
        console.error('fetchNearbyShops error:', e);
      }
    };

    // Check saved location first
    const savedLocation = loadLocation();
    if (savedLocation) {
      console.log(`[Location] Using saved location: ${savedLocation.lat}, ${savedLocation.lon}`);
      fetchLatest(savedLocation.lat, savedLocation.lon);
      fetchNearbyShops(savedLocation.lat, savedLocation.lon);
    } else if (typeof navigator !== 'undefined' && navigator.geolocation) {
      console.log('[Geolocation] Requesting user position...');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          console.log(`[Geolocation] Success: ${lat}, ${lon}`);
          try { saveLocation(lat, lon); } catch (e) {}
          fetchLatest(lat, lon);
          fetchNearbyShops(lat, lon);
        },
        (err) => {
          console.warn('[Geolocation] Failed or denied:', err.message || err.code);
          // fallback center (San Francisco)
          const lat = 37.7749;
          const lon = -122.4194;
          console.log(`[Geolocation] Using fallback: SF ${lat}, ${lon}`);
          fetchLatest(lat, lon);
          fetchNearbyShops(lat, lon);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    } else {
      console.warn('[Geolocation] navigator.geolocation not available');
      const lat = 37.7749;
      const lon = -122.4194;
      fetchLatest(lat, lon);
      fetchNearbyShops(lat, lon);
    }

    return () => { cancelled = true; };
  }, []);

  const getApiBase = () => {
    // Prefer explicit env var when provided (used for override). When running in the browser
    // default to the current origin so client-side fetches use the same host the page was loaded from.
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') return window.location.origin;
    return 'http://localhost:3000';
  };

  const handleSearch = async (term: string, location: string, coords?: { latitude: number; longitude: number } | null, filters?: string[]) => {
    setLoading(true);
    setError(null);
    try {
      // Prefer explicit API URL via `NEXT_PUBLIC_API_URL` (set to e.g. http://localhost:3000 or http://api:3000 in compose).
      const apiBase = getApiBase();
      // Prefer the API search endpoint which returns normalized DB-backed results.
      const url = new URL('/api/yelp-search', apiBase);
      
      let searchTerm = term || 'barber';
      if (filters) {
        const styleFilters = filters.filter(f => ['Fade', 'Beard trim'].includes(f));
        if (styleFilters.length > 0) {
          searchTerm += ' ' + styleFilters.join(' ');
        }
        if (filters.includes('Open now')) {
          url.searchParams.set('open_now', 'true');
        }
        // Note: 'Mobile' attribute support depends on Yelp API or backend implementation
        if (filters.includes('Mobile')) {
           searchTerm += ' mobile';
        }
      }
      url.searchParams.set('term', searchTerm);

      if (coords) {
        url.searchParams.set('latitude', String(coords.latitude));
        url.searchParams.set('longitude', String(coords.longitude));
      } else {
        // If the location looks like `lat,lon` use latitude & longitude parameters, else use location text
        const maybeCoords = (location || '').split(',');
        if (maybeCoords.length === 2 && !isNaN(Number(maybeCoords[0])) && !isNaN(Number(maybeCoords[1]))) {
          url.searchParams.set('latitude', String(Number(maybeCoords[0])));
          url.searchParams.set('longitude', String(Number(maybeCoords[1])));
        } else {
          url.searchParams.set('location', location || 'San Francisco, CA');
        }
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const items = (data.results || data || []);
      const mapped = items.map((b: any) => mapApiBarberToUi(b));
      setResults(mapped as unknown as UiBarber[]);
      // debounce and batch enqueue discovery jobs for returned shops
      try {
        scheduleEnqueue(items);
      } catch (e) {
        // ignore
      }
    } catch (err: any) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Debounce and batching for enqueueing discovery jobs
  const enqueueTimer = useRef<number | null>(null);
  const pendingShops = useRef<any[]>([]);
  const [discoveryJobs, setDiscoveryJobs] = useState<any[]>([]);
  const [discoveryBanner, setDiscoveryBanner] = useState<{ visible: boolean; count: number }>({ visible: false, count: 0 });

  const scheduleEnqueue = (shops: any[]) => {
    // append shops to pending list, dedupe by id
    const ids = new Set(pendingShops.current.map(s => s.id));
    for (const s of shops) if (!ids.has(s.id)) pendingShops.current.push(s);
    if (enqueueTimer.current) window.clearTimeout(enqueueTimer.current);
    // schedule enqueue in 1s (debounce)
    enqueueTimer.current = window.setTimeout(() => {
      doEnqueuePending();
    }, 1000) as unknown as number;
  };

  const doEnqueuePending = async () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const enqueueUrl = new URL('/api/search', apiBase).toString();
    const toSend = pendingShops.current.splice(0, 10); // limit batch
    if (!toSend.length) return;
    setDiscoveryBanner({ visible: true, count: toSend.length });
    const jobs: any[] = [];
    await Promise.all(toSend.map(async (shop) => {
      try {
        const res = await fetch(enqueueUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: shop.name, location: shop.address, yelp_id: shop.id }) });
        if (res.ok) {
          const data = await res.json();
          jobs.push(data.job || data);
        }
      } catch (e) {
        // ignore per-item errors
      }
    }));
    setDiscoveryJobs(prev => [...jobs, ...prev]);
    // hide banner after a short delay
    setTimeout(() => setDiscoveryBanner({ visible: false, count: 0 }), 4000);
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Find your next barber</p>
          <h1>Search barbers by style, trust, and distance</h1>
          <p className="lede">See real trust scores, recent cuts, and specialties before you book.</p>
          <div className="hero-card">
            <SearchBar onSearch={handleSearch} />
            {discoveryBanner.visible && (
              <div style={{ marginTop: 8, padding: 8, background: '#07323a', borderRadius: 8, color: '#bfeafc' }}>
                Discovery requested for {discoveryBanner.count} shop{discoveryBanner.count>1? 's':''}. Workers will fetch social profiles shortly.
                {discoveryJobs.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 13 }}>
                    Job IDs: {discoveryJobs.slice(0,5).map(j => j.id || j.job_id || j["id"]).filter(Boolean).join(', ')}{discoveryJobs.length>5? '...': ''}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="map-shell">
          <div className="map-placeholder">Map preview</div>
          <p className="map-note">Map wiring TBD — will show clusters and pin cards.</p>
        </div>
      </section>

      <section className="results">
        {latestPositive && latestPositive.barber && latestPositive.review && (
          <div style={{ marginBottom: 18, padding: 14, border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, background: '#071018' }}>
            <h3 style={{ margin: '0 0 6px' }}>Latest positive comment nearby</h3>
            <p style={{ margin: 0 }}>
              <strong>{latestPositive.barber.name}</strong>
              {latestPositive.barber.distance_m ? ` — ${(latestPositive.barber.distance_m/1609.34).toFixed(1)} mi` : ''}
            </p>
            <p style={{ margin: '6px 0 8px' }}>{latestPositive.review.summary}</p>
            <a className="link" href={`/shop/${latestPositive.barber.id}`}>Open shop →</a>
          </div>
        )}
        <div className="results-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <h2>Top nearby barbers</h2>
            <p>{loading ? 'Searching Yelp…' : 'Powered by Yelp proxy'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {mounted ? <AdminReconciler /> : null}
          </div>
        </div>
        {error && <p style={{ color: '#f87272' }}>{error}</p>}
        <div className="grid">
          {results.map((b) => (
            <article key={b.id} className="card">
              <div className="thumb" style={{ backgroundImage: `url(${b.thumb})` }} />
              <div className="card-body">
                <div className="row">
                  <h3>{b.name}</h3>
                  <TrustScoreBadge score={b.trust} />
                </div>
                <p className="muted">{b.shop} · {b.distance}</p>
                <p className="chips">
                  {b.specialties.map((s) => (
                    <span key={s}>{s}</span>
                  ))}
                </p>
                <div className="row bottom">
                  <span className="price">{b.price}</span>
                  {(() => {
                    const rawId = String((b as any).id || '');
                    const safeId = encodeURIComponent(rawId.trim());
                    return <a className="link" href={(b as any).entityType === 'shop' ? `/shop/${safeId}` : `/barbers/${safeId}`}>View profile →</a>;
                  })()}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <style jsx>{`
        .page { padding: 32px 24px 48px; color: #e7eef7; background: radial-gradient(circle at 10% 20%, rgba(79,180,255,0.08), transparent 35%), #05090f; min-height: 100vh; }
        .hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 32px; align-items: center; }
        h1 { font-size: 38px; margin: 6px 0 12px; }
        .eyebrow { letter-spacing: 1px; text-transform: uppercase; color: #8fa3b5; font-size: 12px; }
        .lede { color: #b9c7d6; max-width: 560px; }
        .hero-card { margin-top: 18px; display: flex; flex-direction: column; gap: 12px; }
        .map-shell { align-self: stretch; }
        .map-placeholder { border: 1px dashed #294055; border-radius: 14px; height: 260px; display: grid; place-items: center; color: #7da4c0; background: #0b111a; }
        .map-note { color: #8fa3b5; font-size: 13px; margin-top: 8px; }
        .results { margin-top: 48px; }
        .results-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; flex-wrap: wrap; }
        .grid { margin-top: 16px; display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
        .card { border: 1px solid #1f2b36; border-radius: 14px; overflow: hidden; background: #0b111a; box-shadow: 0 10px 40px rgba(0,0,0,0.35); display: grid; grid-template-rows: 180px 1fr; }
        .thumb { background-size: cover; background-position: center; }
        .card-body { padding: 14px; display: flex; flex-direction: column; gap: 6px; }
        .row { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
        h3 { margin: 0; font-size: 18px; }
        .muted { margin: 0; color: #8fa3b5; font-size: 14px; }
        .chips { margin: 0; display: flex; gap: 6px; flex-wrap: wrap; }
        .chips span { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.06); padding: 6px 10px; border-radius: 999px; font-size: 13px; }
        .bottom { margin-top: 6px; }
        .price { color: #d1e2f4; font-weight: 700; }
        .link { color: #4fb4ff; text-decoration: none; font-weight: 600; }
        .link:hover { text-decoration: underline; }
        @media (max-width: 960px) { .hero { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
