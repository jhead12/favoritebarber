import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { mapApiBarberToUi, UiBarber } from '../../../lib/adapters';
import { setLastVisitedBarber } from '../../../lib/lastVisited';

export default function BarberPhotosPage(): React.ReactElement {
  const router = useRouter();
  const { id } = router.query;
  const [barber, setBarber] = useState<UiBarber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const res = await fetch(`${apiBase}/api/barbers/${id}`);
        if (res.status === 404) {
          setError('Barber not found');
          setBarber(null);
        } else if (!res.ok) {
          throw new Error(`fetch failed: ${res.status}`);
        } else {
          const raw = await res.json();
          setBarber(mapApiBarberToUi(raw));
          try { setLastVisitedBarber({ id: raw.id, name: raw.name || '', shop: (raw.primary_location && raw.primary_location.formatted_address) || '', timestamp: Date.now() }); } catch (e) {}
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

  if (loading) return <div>Loading photos...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!barber) return <div>No barber data available</div>;

  const images: string[] = [];
  // @ts-ignore
  if ((barber as any).images && Array.isArray((barber as any).images)) images.push(...(barber as any).images);
  // @ts-ignore
  if ((barber as any).photos && Array.isArray((barber as any).photos)) images.push(...(barber as any).photos);
  if (barber.thumb) images.push(barber.thumb);

  return (
    <main style={{ padding: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => router.back()} style={{ padding: '6px 10px' }}>← Back</button>
      </div>
      <h1>Photos — {barber.name}</h1>
      {images.length === 0 && <div>No photos available</div>}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
        {images.map((src, i) => (
          <div key={i} style={{ width: 200, height: 200, overflow: 'hidden', border: '1px solid #ddd' }}>
            <img src={src} alt={`photo-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
    </main>
  );
}
