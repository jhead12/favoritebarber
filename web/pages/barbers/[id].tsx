import React from 'react';
import TrustScoreBadge from '../../components/TrustScoreBadge';

const MOCK = {
  name: 'Tony “Fade Lab” Rivera',
  shop: 'Mission Cuts · San Francisco',
  trust: 92,
  hero: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=60',
  tagline: 'Precision fades, beard sculpting, and calm chair-side vibe.',
  specialties: ['Low fade', 'Skin fade', 'Beard trim', 'Line-up'],
  hairstyles: ['Fade', 'Taper', 'Beard Trim'],
  services: [
    { name: 'Skin Fade + Beard', price: '$65', duration: '50 min' },
    { name: 'Classic Fade', price: '$45', duration: '35 min' },
    { name: 'Beard Sculpt', price: '$30', duration: '20 min' },
  ],
  gallery: [
    'https://images.unsplash.com/photo-1503951914909-04e7d77c5cde?auto=format&fit=crop&w=600&q=60',
    'https://images.unsplash.com/photo-1503951914646-5700dea92f62?auto=format&fit=crop&w=600&q=60',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=60',
  ],
  reviews: [
    { author: 'Maria G.', text: 'Best skin fade I’ve had in SF. Super clean lines, chill playlist.', rating: 5 },
    { author: 'Andre P.', text: 'Booked last minute, Tony nailed the taper. Will return.', rating: 5 },
  ],
  claimed: false,
};

export default function BarberProfile() {
  return (
    <main className="page">
      <section className="hero" style={{ backgroundImage: `url(${MOCK.hero})` }}>
        <div className="overlay" />
        <div className="hero-content">
          <TrustScoreBadge score={MOCK.trust} />
          <h1>{MOCK.name}</h1>
          <p className="muted">{MOCK.shop}</p>
          <p className="lede">{MOCK.tagline}</p>
          <div className="chips">
            {MOCK.specialties.map((s) => <span key={s}>{s}</span>)}
          </div>
          {MOCK.claimed ? (
            <div className="cta">
              <button>Book</button>
              <button className="ghost">Message</button>
            </div>
          ) : (
            <div className="unclaimed">
              <span className="pill">Unclaimed profile</span>
              <p className="muted">
                Booking and messaging are unavailable until this barber verifies ownership. Currently showing scraped info only.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="two-col">
        <div className="left">
          <h2>Services</h2>
          <div className="panel">
            {MOCK.services.map((svc) => (
              <div className="svc" key={svc.name}>
                <div>
                  <p className="svc-name">{svc.name}</p>
                  <p className="muted">{svc.duration}</p>
                </div>
                <p className="svc-price">{svc.price}</p>
              </div>
            ))}
          </div>

          <h2>Reviews</h2>
          <div className="panel">
            {MOCK.reviews.map((r) => (
              <div className="review" key={r.author}>
                <div className="review-head">
                  <strong>{r.author}</strong>
                  <span>{'★'.repeat(r.rating)}</span>
                </div>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="right">
          <h2>Gallery</h2>
          <div className="gallery">
            {MOCK.gallery.map((src, i) => (
              <div className="shot" key={i} style={{ backgroundImage: `url(${src})` }} />
            ))}
          </div>

          <h2>Hairstyles</h2>
          <div className="chips">
            {MOCK.hairstyles.map((h) => <span key={h}>{h}</span>)}
          </div>
        </div>
      </section>

      <style jsx>{`
        .page { color: #e7eef7; background: #05090f; min-height: 100vh; }
        .hero { position: relative; padding: 60px 24px 80px; background-size: cover; background-position: center; }
        .overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(5,9,15,0.55), #05090f 80%); }
        .hero-content { position: relative; max-width: 720px; z-index: 1; display: grid; gap: 10px; }
        h1 { font-size: 36px; margin: 0; }
        .muted { color: #9bb0c4; margin: 0; }
        .lede { color: #cdd9e5; margin: 4px 0 8px; }
        .chips { display: flex; gap: 8px; flex-wrap: wrap; }
        .chips span { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.08); padding: 8px 10px; border-radius: 12px; font-size: 13px; }
        .cta { display: flex; gap: 10px; margin-top: 8px; }
        .unclaimed { margin-top: 8px; display: grid; gap: 6px; max-width: 520px; }
        .pill { display: inline-flex; padding: 6px 10px; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); font-weight: 700; font-size: 12px; letter-spacing: 0.5px; text-transform: uppercase; }
        button { border: none; padding: 12px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; background: linear-gradient(135deg, #4fb4ff, #6dd5fa); color: #041019; }
        .ghost { background: rgba(255,255,255,0.08); color: #e7eef7; border: 1px solid rgba(255,255,255,0.12); }
        .two-col { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 24px; padding: 0 24px 48px; }
        h2 { margin: 18px 0 10px; }
        .panel { background: #0b111a; border: 1px solid #1f2b36; border-radius: 14px; padding: 14px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); display: grid; gap: 12px; }
        .svc { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1a2430; padding-bottom: 10px; }
        .svc:last-child { border-bottom: none; padding-bottom: 0; }
        .svc-name { margin: 0; font-weight: 700; }
        .svc-price { margin: 0; font-weight: 700; color: #d1e2f4; }
        .review { border-bottom: 1px solid #1a2430; padding-bottom: 10px; }
        .review:last-child { border-bottom: none; padding-bottom: 0; }
        .review-head { display: flex; justify-content: space-between; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; }
        .shot { border-radius: 12px; height: 140px; background-size: cover; background-position: center; border: 1px solid #1f2b36; }
        @media (max-width: 960px) { .two-col { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
