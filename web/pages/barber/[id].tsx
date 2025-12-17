import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { mapApiBarberToUi, UiBarber } from '../../lib/adapters';
import { setLastVisitedBarber } from '../../lib/lastVisited';

type Props = {
  barberRaw: any | null;
  yelpError?: { status?: number; detail?: string } | null;
};

export default function BarberProfilePage({ barberRaw, yelpError }: Props): React.ReactElement {
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

  if (!barberRaw || !barber) {
    if (yelpError) {
      return (
        <main style={{ padding: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => (typeof window !== 'undefined' ? window.history.back() : null)} style={{ padding: '6px 10px' }}>
              ← Back
            </button>
          </div>
          <h1>Profile unavailable</h1>
          <p>We couldn't find this barber in the local database.</p>
          <p style={{ color: '#c66' }}>Yelp fallback error: {yelpError.status || 'unknown'} {yelpError.detail ? `— ${yelpError.detail}` : ''}</p>
          <p>You can enqueue discovery to fetch and enrich this shop's data.</p>
        </main>
      );
    }
    return <div>No barber found</div>;
  }

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
          {(() => {
            // Aggregate unique hairstyles from enriched images (gallery)
            const allHairstyles = new Set<string>();
            const gallery = barberRaw?.gallery || [];
            gallery.forEach((img: any) => {
              if (img.hairstyles && Array.isArray(img.hairstyles)) {
                img.hairstyles.forEach((style: string) => allHairstyles.add(style));
              }
            });
            const hairstyles = Array.from(allHairstyles).sort();
            if (hairstyles.length > 0) {
              return (
                <p style={{ margin: '8px 0 0' }}><strong>Specialties (AI-detected):</strong> {hairstyles.join(', ')}</p>
              );
            }
            return null;
          })()}
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
            <p><a href={`/shop/${encodeURIComponent(String(shop.id).trim())}`}>Open shop page</a></p>
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
    if (res.status === 404) {
      // Fallback: if id looks like a Yelp id try fetching Yelp business details
      if (typeof id === 'string' && isNaN(Number(id))) {
        try {
          // Prefer GraphQL proxy for richer data
          let yRes = await fetch(`${apiBase}/api/yelp-graphql/business/${encodeURIComponent(id)}`);
          if (!yRes.ok) {
            yRes = await fetch(`${apiBase}/api/yelp-business/${encodeURIComponent(id)}`);
          }
          if (yRes.ok) {
            const b = await yRes.json();
            // Build a minimal barberRaw shape used by the page
            const barberRaw = {
              id: b.id,
              name: b.name,
              primary_location: { formatted_address: b.address },
              thumbnail_url: b.images && b.images.length ? b.images[0].url : '',
              trust_score: { value: Math.min(100, Math.round((b.rating || 0) / 5 * 100)) },
              reviews: [],
            };
            return { props: { barberRaw } };
          } else {
            const txt = await yRes.text().catch(() => null);
            return { props: { barberRaw: null, yelpError: { status: yRes.status, detail: txt } } };
          }
        } catch (e) {
          // ignore and continue to return notFound
        }
      }
      return { notFound: true };
    }
    if (!res.ok) return { props: { barberRaw: null } };
    const barberRaw = await res.json();
    return { props: { barberRaw } };
  } catch (e) {
    return { props: { barberRaw: null } };
  }
}
