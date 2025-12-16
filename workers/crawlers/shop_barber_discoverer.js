#!/usr/bin/env node
// Discover individual barbers associated with shops by searching the web
// Uses `searchSocialProfilesBing` in dry-run mode to collect candidates before optionally persisting

const { pool } = require('../../api/db');
const { searchSocialProfilesBing } = require('./social_searcher_bing');
const { createCandidate } = require('../../api/models/socialProfile');

async function getShopsToProcess(limit = 10) {
  // select shops with a primary location if available
  const q = `SELECT s.id, s.name, s.yelp_business_id, l.formatted_address, l.city, l.region
             FROM shops s
             LEFT JOIN locations l ON s.primary_location_id = l.id
             ORDER BY s.id DESC
             LIMIT $1`;
  const res = await pool.query(q, [limit]);
  return res.rows || [];
}

function buildQueriesForShop(shop) {
  const locParts = [];
  if (shop.city) locParts.push(shop.city);
  if (shop.region) locParts.push(shop.region);
  const loc = locParts.join(', ');
  const base = `${shop.name} ${loc}`.trim();
  return [
    `${base} barbers`,
    `${base} barbers team`,
    `${base} stylists`,
    `${base} "our barbers"`,
    `${base} staff`,
    `${base} meet the team`,
  ];
}

async function discoverForShop(shop, opts = { dryRun: true }) {
  console.log('\nDiscovering for shop:', shop.name, shop.formatted_address || `${shop.city || ''} ${shop.region || ''}`);
  const queries = buildQueriesForShop(shop);
  const results = await searchSocialProfilesBing({ name: shop.name, location: shop.city || shop.region || '', queries, dryRun: true });

  // Optionally persist candidates with shop evidence
  if (!opts.dryRun) {
    for (const r of results) {
      try {
        const cand = r.candidate || {};
        // attach shop id to evidence for traceability
        const evidence = Object.assign({}, cand.evidence || {}, { shop_id: shop.id });
        await createCandidate({ platform: cand.platform, handle: cand.handle, profile_url: cand.profile_url, name: cand.name || null, evidence, confidence: cand.confidence || 0, source: 'shop_discovery' });
      } catch (e) {
        console.warn('Failed to persist candidate for shop', shop.id, e.message || e);
      }
    }
  }

  return results;
}

async function run(limit = 5, persist = false) {
  const shops = await getShopsToProcess(limit);
  console.log('Shops to process:', shops.length);
  const summary = [];
  for (const s of shops) {
    const res = await discoverForShop(s, { dryRun: !persist });
    summary.push({ shop: s, found: res.length });
  }
  return summary;
}

if (require.main === module) {
  (async () => {
    const limitArg = parseInt(process.argv[2] || '5', 10);
    const persistFlag = process.argv.includes('--persist');
    try {
      const out = await run(limitArg, persistFlag);
      console.log('\nDone. Summary:');
      out.forEach(o => console.log(`- ${o.shop.name} => ${o.found} candidates`));
      process.exit(0);
    } catch (e) {
      console.error('Error in shop_barber_discoverer', e.message || e);
      process.exit(1);
    }
  })();
}
