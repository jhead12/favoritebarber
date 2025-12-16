import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { mapApiBarberToUi, UiBarber } from '../../lib/adapters';
import { setLastVisitedBarber } from '../../lib/lastVisited';

export default function ShopPage(): React.ReactElement {
  const router = useRouter();
  const { id } = router.query;
  const [barber, setBarber] = useState<UiBarber | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        // Prefer GraphQL business proxy for richer data, fallback to REST yelp-business
        let res = await fetch(`${apiBase}/api/yelp-graphql/business/${encodeURIComponent(String(id))}`);
        if (!res.ok) {
          res = await fetch(`${apiBase}/api/shops/${id}`);
        }
        if (res.status === 404) {
          // Try falling back to Yelp business proxy when shop isn't in our DB
          // Yelp ids are typically strings, while our internal shop ids are numeric
          if (typeof id === 'string' && isNaN(Number(id))) {
            const yRes = await fetch(`${apiBase}/api/yelp-business/${encodeURIComponent(id)}`);
            if (yRes.ok) {
              const raw = await yRes.json();
              const ui = {
                id: raw.id,
                name: raw.name || '',
                shop: raw.name || '',
                distance: '',
                trust: Math.min(100, Math.round((raw.rating || 0) / 5 * 100)),
                specialties: raw.categories || [],
                price: '$$?',
                thumb: raw.images && raw.images.length ? raw.images[0].url : ''
              } as any;
              setGallery((raw.images || []).map((i: any) => i.url).filter(Boolean));
              setBarber(ui);
              try { setLastVisitedBarber({ id: raw.id, name: raw.name || '', shop: raw.name || '', timestamp: Date.now() }); } catch (e) {}
            } else {
              setError('Shop not found');
              setBarber(null);
            }
          } else {
            setError('Shop not found');
            setBarber(null);
          }
        } else if (!res.ok) {
          throw new Error(`fetch failed: ${res.status}`);
        } else {
          const raw = await res.json();
          // map shop -> UiBarber-like minimal object for legacy UI (use first barber if available)
          const firstBarber = raw.barbers && raw.barbers.length ? raw.barbers[0] : null;
          const ui = {
            id: raw.id,
            name: raw.name || '',
            shop: raw.name || '',
            distance: '',
            trust: Number(raw.trust_score) || 0,
            specialties: [],
            price: '$$?',
            thumb: raw.images && raw.images.length ? raw.images[0].url : ''
          } as any;
          setGallery((raw.images || []).map((i: any) => i.url).filter(Boolean));
          setBarber(ui);
          try {
            setLastVisitedBarber({ id: raw.id, name: raw.name || '', shop: raw.name || '', timestamp: Date.now() });
          } catch (e) {}
        }
      } catch (err: any) {
        setError(err.message || String(err));
        setBarber(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // cycle gallery index when images available
  useEffect(() => {
    if (!gallery || gallery.length <= 1) return;
    const tid = setInterval(() => setGalleryIndex((i) => (i + 1) % gallery.length), 3000);
    return () => clearInterval(tid);
  }, [gallery]);

  if (loading) return <div>Loading shop...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!barber) return <div>No barber data available</div>;

  return (
    <main style={{ padding: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => router.back()} style={{ padding: '6px 10px' }}>← Back</button>
      </div>
      <h1>{barber.name}</h1>
      <p><strong>Shop:</strong> {barber.shop}</p>
      <p><strong>Distance:</strong> {barber.distance}</p>
      <p><strong>Trust:</strong> {barber.trust}</p>
      <p><strong>Specialties:</strong> {barber.specialties?.join ? barber.specialties.join(', ') : JSON.stringify(barber.specialties)}</p>
      {gallery && gallery.length > 0 ? (
        <div style={{ width: 360, height: 240, overflow: 'hidden', borderRadius: 8 }}>
          <img src={gallery[galleryIndex]} alt={`${barber.name} image ${galleryIndex + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : barber.thumb ? (
        <img src={barber.thumb} alt={`${barber.name} thumbnail`} style={{ maxWidth: 300 }} />
      ) : null}
    </main>
  );
}

 
