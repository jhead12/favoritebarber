#!/usr/bin/env node
/*
 Simple integration test:
 - Calls Yelp Business Search for `barbers` in the given location
 - Fetches reviews for the first business returned
 - Prints review `time_created` and text
 - Runs `parseReview()` on the text and prints language/prefilter info

Usage:
  YELP_API_KEY=your_key node workers/test_yelp_llm_integration.js "San Francisco, CA"

If YELP_API_KEY is not set, the script will exit with an error.
*/

require('dotenv').config({ path: '.env' });
const fetch = global.fetch || require('node-fetch');
const { parseReview } = require('./llm/review_parser');

const API_BASE = 'https://api.yelp.com/v3';

function loadKey() {
  const key = process.env.YELP_API_KEY;
  if (!key) {
    console.error('YELP_API_KEY not set. Set it in environment or .env file.');
    process.exit(1);
  }
  return key;
}

async function yelpApi(path) {
  const key = loadKey();
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${key}` } });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Yelp API ${res.status} ${res.statusText}: ${txt}`);
  }
  return res.json();
}

async function run(location = 'San Francisco, CA') {
  console.log('Searching Yelp for `barbers` near:', location);
  const search = await yelpApi(`/businesses/search?term=barbers&location=${encodeURIComponent(location)}&limit=3`);
  const businesses = search.businesses || [];
  if (businesses.length === 0) {
    console.log('No businesses found for location:', location);
    return;
  }

  const b = businesses[0];
  console.log('\nSelected business:');
  console.log('  id:', b.id);
  console.log('  name:', b.name);
  console.log('  rating:', b.rating, 'reviews:', b.review_count);

  console.log('\nFetching reviews for business', b.id);
  const details = await yelpApi(`/businesses/${b.id}/reviews`);
  const reviews = details.reviews || [];
  if (reviews.length === 0) {
    console.log('No reviews returned by Yelp for business', b.id);
    return;
  }

  console.log(`\nFound ${reviews.length} reviews. Running parseReview() on each:`);
  for (const r of reviews) {
    console.log('\n---');
    console.log('time_created:', r.time_created || '(none)');
    console.log('user:', r.user && r.user.name ? r.user.name : '(anonymous)');
    console.log('text:', r.text.substring(0, 400).replace(/\n/g,' '));

    try {
      const parsed = await parseReview(r.text || '', b.name || null);
      console.log('Parsed language:', parsed.language, 'confidence:', parsed.language_confidence);
      if (parsed.prefilter) {
        console.log('Prefilter flags:', JSON.stringify(parsed.prefilter.flags));
      }
      console.log('Summary:', parsed.summary ? parsed.summary.substring(0,300) : '(none)');
    } catch (err) {
      console.error('parseReview error:', err.message || err);
    }
  }
}

if (require.main === module) {
  const loc = process.argv.slice(2).join(' ') || 'San Francisco, CA';
  run(loc).catch(err => { console.error('Error:', err.message || err); process.exit(1); });
}

module.exports = { run };
