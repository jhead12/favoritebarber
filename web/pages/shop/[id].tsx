import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { mapApiBarberToUi, UiBarber } from '../../lib/adapters';
import { setLastVisitedBarber } from '../../lib/lastVisited';

export default function ShopPage(): JSX.Element {
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
          try {
            setLastVisitedBarber({ id: raw.id, name: raw.name || '', shop: (raw.primary_location && raw.primary_location.formatted_address) || '', timestamp: Date.now() });
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
      {barber.thumb ? <img src={barber.thumb} alt={`${barber.name} thumbnail`} style={{ maxWidth: 300 }} /> : null}
    </main>
  );
}
