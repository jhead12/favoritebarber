import React, { useState, useEffect, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import TrustScoreBadge from '../components/TrustScoreBadge';
import dynamic from 'next/dynamic';
const AdminReconciler = dynamic(() => import('../components/AdminReconciler'), { ssr: false, loading: () => null });
import { mapApiBarberToUi, UiBarber } from '../lib/adapters';

const MOCK_BARBERS = [
  {
    id: 'b1',
    name: 'Tony “Fade Lab” Rivera',
    shop: 'Mission Cuts',
    distance: '0.4 mi',
    trust: 92,
    specialties: ['Low fade', 'Skin fade', 'Beard trim'],
    price: '$45+',
    thumb: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'b2',
    name: 'Samir K.',
    shop: 'SoMa Barber Co.',
    distance: '1.1 mi',
    trust: 85,
    specialties: ['Taper', 'Textured crop', 'Pompadour'],
    price: '$50+',
    thumb: 'https://images.unsplash.com/photo-1503951914909-04e7d77c5cde?auto=format&fit=crop&w=400&q=60',
  },
  {
    id: 'b3',
    name: 'Alex “Clipper” Chen',
    shop: 'Independent • Mobile',
    distance: '2.3 mi',
    trust: 77,
    specialties: ['Buzz', 'Crew', 'Line-up'],
    price: '$40+',
    thumb: 'https://images.unsplash.com/photo-1503951914646-5700dea92f62?auto=format&fit=crop&w=400&q=60',
  },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [results, setResults] = useState<UiBarber[]>(MOCK_BARBERS as unknown as UiBarber[]);
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

    // Additionally fetch MCP barbers to populate the results list (DB-backed view)
    const fetchMcpBarbers = async () => {
      try {
        const url = new URL('/api/mcp/barbers', apiBase);
        const res = await fetch(url.toString());
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data && Array.isArray(data.results) && data.results.length > 0) {
          const mapped = data.results.map((b: any) => mapApiBarberToUi(b));
          setResults(mapped);
        }
      } catch (e) {
        // ignore
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchLatest(pos.coords.latitude, pos.coords.longitude),
        () => {
          // fallback center (San Francisco)
          fetchLatest(37.7749, -122.4194);
          fetchMcpBarbers();
        },
        { timeout: 5000 }
      );
    } else {
      fetchLatest(37.7749, -122.4194);
      fetchMcpBarbers();
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

  const handleSearch = async (term: string, location: string) => {
    // (old signature supported only term+location). If caller supplies coords, they will be appended.
    setLoading(true);
    setError(null);
    try {
      // Prefer explicit API URL via `NEXT_PUBLIC_API_URL` (set to e.g. http://localhost:3000 or http://api:3000 in compose).
      const apiBase = getApiBase();
      // Prefer the API search endpoint which returns normalized DB-backed results.
      // The SearchBar may pass coordinates in the location string as `lat,lon`. Detect that.
      const url = new URL('/api/yelp-search', apiBase);
      url.searchParams.set('term', term || 'barber');

      // If the location looks like `lat,lon` use latitude & longitude parameters, else use location text
      const maybeCoords = (location || '').split(',');
      if (maybeCoords.length === 2 && !isNaN(Number(maybeCoords[0])) && !isNaN(Number(maybeCoords[1]))) {
        url.searchParams.set('latitude', String(Number(maybeCoords[0])));
        url.searchParams.set('longitude', String(Number(maybeCoords[1])));
      } else {
        url.searchParams.set('location', location || 'San Francisco, CA');
      }

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`Search failed (${res.status})`);
      const data = await res.json();
      const items = (data.results || data || []);
      const mapped = items.map((b: any) => mapApiBarberToUi(b));
      setResults(mapped);
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
            <div className="filters">
              <button>Fade</button>
              <button>Beard trim</button>
              <button>Mobile</button>
              <button>Open now</button>
            </div>
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
            <a className="link" href={`/barbers/${latestPositive.barber.id}`}>Open profile →</a>
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
        .filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .filters button { padding: 8px 12px; border-radius: 10px; border: 1px solid #1f2b36; background: #0f1620; color: #d9e3ee; cursor: pointer; }
        .filters button:hover { border-color: #4fb4ff; }
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
