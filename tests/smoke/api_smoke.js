// Simple smoke tests for local API endpoints
// Run with: node tests/smoke/api_smoke.js

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function checkYelpSearch() {
  const url = `${API_BASE}/api/yelp-search?term=barber&location=San%20Francisco&limit=3`;
  console.log('Checking', url);
  const res = await fetch(url);
  if (!res.ok) fail(`/api/yelp-search returned ${res.status}`);
  const j = await res.json();
  if (!j.results || !Array.isArray(j.results)) fail('/api/yelp-search returned unexpected payload');
  console.log('  ok, got', j.results.length, 'results');
  return j.results;
}

async function checkYelpBusiness(sampleId) {
  const url = `${API_BASE}/api/yelp-business/${encodeURIComponent(String(sampleId))}`;
  console.log('Checking', url);
  const res = await fetch(url);
  if (!res.ok) fail(`/api/yelp-business/${sampleId} returned ${res.status}`);
  const j = await res.json();
  if (!j || !j.name) fail(`/api/yelp-business/${sampleId} missing name`);
  console.log('  ok, name=', j.name);
}

async function checkBarberEndpoint(sampleId) {
  const url = `${API_BASE}/api/barbers/${encodeURIComponent(String(sampleId))}`;
  console.log('Checking', url);
  const res = await fetch(url);
  if (res.status === 404) {
    console.log('  barber endpoint returned 404 (acceptable for non-DB id)');
    return;
  }
  if (!res.ok) fail(`/api/barbers/${sampleId} returned ${res.status}`);
  const j = await res.json();
  if (!j || !j.id) fail(`/api/barbers/${sampleId} returned unexpected payload`);
  console.log('  ok, barber id=', j.id);
}

async function run() {
  console.log('API smoke tests (API_BASE=', API_BASE, ')');
  const results = await checkYelpSearch();
  if (results.length === 0) fail('no yelp results to test further');
  const sample = results[0];
  // Try yelp-business for first result id
  await checkYelpBusiness(sample.id);
  // Try barber endpoint: using the yelp id may return 404 until discovered; that's okay
  await checkBarberEndpoint(sample.id);

  console.log('\nSMOKE TESTS PASSED');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
