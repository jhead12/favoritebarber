import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { mapApiBarberToUi, UiBarber } from '../../lib/adapters';
import { setLastVisitedBarber } from '../../lib/lastVisited';

type Props = {
  barberRaw: any | null;
};

export default function BarberProfilePage({ barberRaw }: Props): JSX.Element {
  const router = useRouter();
  const barber = barberRaw ? mapApiBarberToUi(barberRaw) : null;

  useEffect(() => {
    if (!barberRaw) return;
    try {
      setLastVisitedBarber({
        id: barberRaw.id,
        name: barberRaw.name || '',
        shop: (barberRaw.primary_location && (barberRaw.primary_location.name || barberRaw.primary_location.formatted_address)) || (barberRaw.shop && barberRaw.shop.name) || '',
        timestamp: Date.now(),
      });
    } catch (e) {}
  }, [barberRaw]);

  if (!barberRaw || !barber) return <div>No barber found</div>;

  const barberVerified = barberRaw.verified === true || barberRaw.is_verified === true || !!barberRaw.verified_at || barberRaw.status === 'verified';
  const shop = barberRaw.primary_location || barberRaw.shop || null;
  const shopVerified = !!shop && (shop.verified === true || shop.is_verified === true || !!shop.verified_at || shop.status === 'verified');

  const hasBusinessProfile = barberRaw.business_profile === true || barberRaw.has_business_profile === true || !!barberRaw.business_profile_id;

  const creditsBarber = Number(barberRaw.credits || barberRaw.reward_points || 0);
  const creditsShop = Number(shop && (shop.credits || shop.reward_points) ? (shop.credits || shop.reward_points) : 0);
  const combinedCredits = creditsBarber + creditsShop;

  return (
    <main style={{ padding: 20 }}>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => router.back()} style={{ padding: '6px 10px' }}>
          ← Back
        </button>
      </div>
      <h1>{barber.name}</h1>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {barber.thumb ? <img src={barber.thumb} alt={`${barber.name} thumb`} style={{ width: 140, height: 140, objectFit: 'cover', borderRadius: 6 }} /> : null}
        <div>
          <p style={{ margin: 0 }}><strong>Shop:</strong> {barber.shop || 'Independent'}</p>
          <p style={{ margin: 0 }}><strong>Distance:</strong> {barber.distance}</p>
          <p style={{ margin: 0 }}><strong>Trust:</strong> {barber.trust}</p>
        </div>
      </div>

      <section style={{ marginTop: 18 }}>
        <h2>Verification</h2>
        <p>
          <strong>Barber verified:</strong> {barberVerified ? 'Yes' : 'No'}
          {' '}
          <strong>Shop verified:</strong> {shopVerified ? 'Yes' : 'No'}
        </p>
        <p>
          <strong>Business profile:</strong> {hasBusinessProfile ? 'Exists' : 'None'}
        </p>
      </section>

      <section style={{ marginTop: 18 }}>
        <h2>Credits</h2>
        <p><strong>Barber credits:</strong> {creditsBarber}</p>
        <p><strong>Shop credits:</strong> {creditsShop}</p>
        <p><strong>Combined credits:</strong> {combinedCredits}</p>
        <p style={{ color: '#555' }}>If both the barber and the shop are verified, the barber can earn credits from both pages.</p>
      </section>

      {barberRaw.reviews && barberRaw.reviews.length > 0 && (
        <section style={{ marginTop: 18 }}>
          <h2>Recent comments</h2>
          <div>
            {barberRaw.reviews.map((r: any) => (
              <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                <p style={{ margin: 0 }}>
                  <strong>{r.sanitized ? 'Summary' : 'Comment'}</strong>
                  {r.rating ? ` — ${r.rating}/5` : ''}
                  <span style={{ color: '#666', marginLeft: 8 }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                </p>
                <p style={{ margin: '6px 0 0' }}>{r.summary || 'No text available'}</p>
                {r.sanitized && <p style={{ fontSize: 12, color: '#666', margin: '6px 0 0' }}>Sanitized summary (LLM)</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section style={{ marginTop: 18 }}>
        <h2>Actions</h2>
        {!hasBusinessProfile && (
          <button onClick={() => alert('Claim Business Profile flow not yet implemented')} style={{ padding: '8px 12px' }}>
            Claim Business Profile
          </button>
        )}
        {hasBusinessProfile && (
          <button onClick={() => alert('Manage business profile (not implemented)')} style={{ padding: '8px 12px' }}>
            Manage Business Profile
          </button>
        )}
      </section>

      {shop && (
        <section style={{ marginTop: 18 }}>
          <h2>Shop</h2>
          <p><strong>Name:</strong> {shop.name || shop.formatted_address || barber.shop}</p>
          <p><strong>Verified:</strong> {shopVerified ? 'Yes' : 'No'}</p>
          {shop.id ? (
            <p><a href={`/shop/${shop.id}`}>Open shop page</a></p>
          ) : null}
        </section>
      )}
    </main>
  );
}

export async function getServerSideProps(context: any) {
  const { id } = context.params || {};
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${apiBase}/api/barbers/${id}`);
    if (res.status === 404) return { notFound: true };
    if (!res.ok) return { props: { barberRaw: null } };
    const barberRaw = await res.json();
    return { props: { barberRaw } };
  } catch (e) {
    return { props: { barberRaw: null } };
  }
}
