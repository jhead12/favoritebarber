// Simple Yelp probe to inspect data fields we can collect
// Usage: set YELP_API_KEY in env (we read from process.env)

const API_BASE = 'https://api.yelp.com/v3';
const fetch = global.fetch || require('node-fetch');

// If env var not set, try to load from root .env file (simple parser)
if (!process.env.YELP_API_KEY) {
  const fs = require('fs');
  const envPath = require('path').join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
      if (m) {
        let val = m[2];
        // remove surrounding quotes
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[m[1]] = val;
      }
    }
  }
}

async function api(path) {
  const key = process.env.YELP_API_KEY;
  if (!key) throw new Error('YELP_API_KEY not set in env');
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${key}` }
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Yelp API ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

function printBusinessSummary(b) {
  console.log('---');
  console.log('id:', b.id);
  console.log('name:', b.name);
  console.log('phone:', b.display_phone || b.phone);
  console.log('rating:', b.rating, 'review_count:', b.review_count);
  if (b.location) console.log('address:', (b.location.display_address || []).join(', '));
  if (b.coordinates) console.log('coords:', b.coordinates.latitude, b.coordinates.longitude);
}

async function probe() {
  try {
    console.log('Searching Yelp for `barbers` near San Francisco, CA...');
    const search = await api('/businesses/search?term=barbers&location=San%20Francisco%2C%20CA&limit=3');
    const businesses = search.businesses || [];
    console.log(`Found ${businesses.length} businesses`);
    for (const b of businesses) {
      printBusinessSummary(b);
      // fetch details for photos and more fields
      const details = await api(`/businesses/${b.id}`);
      console.log('photos:', details.photos || []);
      // fetch reviews
      const reviews = await api(`/businesses/${b.id}/reviews`);
      console.log('sample_reviews:');
      for (const r of (reviews.reviews || [])) {
        console.log(' -', r.user && r.user.name ? `${r.user.name}:` : '', r.text.substring(0, 120).replace(/\n/g, ' '));
      }
    }
  } catch (err) {
    console.error('Probe error:', err.message || err);
  }
}

if (require.main === module) probe();
