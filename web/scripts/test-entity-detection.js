// Simple test harness to verify entity detection heuristics used in UI
// This duplicates the adapter detection logic to assert behavior.

function detectEntity(raw) {
  // Heuristics: DB-backed barber has trust_score or thumbnail_url or distance_m
  if (raw && (raw.trust_score || raw.thumbnail_url || raw.distance_m !== undefined)) return 'barber';
  // Yelp-like shop results: assume presence of rating, image_url, categories
  if (raw && (raw.rating !== undefined || raw.image_url || raw.categories)) return 'shop';
  return 'unknown';
}

const samples = [
  {
    name: 'DB Barber', id: '100', trust_score: { value: 88 }, thumbnail_url: 'http://example.com/t.jpg'
  },
  {
    name: 'Yelp Shop', id: 'y1', rating: 4.5, image_url: 'http://example.com/i.jpg'
  },
  {
    name: 'Ambiguous', id: 'a1', address: '123 Main St'
  }
];

console.log('Running entity detection tests...');
for (const s of samples) {
  console.log(`id=${s.id} name=${s.name} -> ${detectEntity(s)}`);
}

// Sanity assertions
const expected = { '100': 'barber', 'y1': 'shop', 'a1': 'unknown' };
let failed = false;
for (const s of samples) {
  const out = detectEntity(s);
  if (out !== expected[s.id]) {
    console.error(`❌ Sample ${s.id} expected ${expected[s.id]} but got ${out}`);
    failed = true;
  }
}
if (!failed) console.log('All tests passed ✅');
else process.exit(2);
