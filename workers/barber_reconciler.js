#!/usr/bin/env node
/**
 * workers/barber_reconciler.js
 *
 * Reconcile discovered social profiles with barbers using heuristics + LLM verifier.
 * - Links social_profile -> barber via `barber_social_links`
 * - Optionally creates a new `barbers` row when confidence is high
 *
 * Usage:
 *   node workers/barber_reconciler.js            # run once (default)
 *   node workers/barber_reconciler.js --limit=50  # process up to N candidates
 */

require('dotenv').config();
const { pool } = require('../api/db');
const { verifyCandidate } = require('../api/lib/llmVerifier');

const DEFAULT_LIMIT = 50;

async function fetchUnlinkedProfiles(limit = DEFAULT_LIMIT) {
  const q = `
    SELECT sp.*
    FROM social_profiles sp
    LEFT JOIN barber_social_links bsl ON bsl.social_profile_id = sp.id
    WHERE bsl.id IS NULL
    ORDER BY confidence DESC NULLS LAST
    LIMIT $1
  `;
  const res = await pool.query(q, [limit]);
  return res.rows || [];
}

async function findBarberByYelpId(yelpId) {
  if (!yelpId) return null;
  const q = `SELECT id, name FROM barbers WHERE yelp_business_id = $1 LIMIT 1`;
  const r = await pool.query(q, [String(yelpId)]);
  return r.rowCount ? r.rows[0] : null;
}

async function findBarberByExactName(name) {
  if (!name) return null;
  const q = `SELECT id, name FROM barbers WHERE lower(name) = lower($1) LIMIT 1`;
  const r = await pool.query(q, [name]);
  if (r.rowCount) return r.rows[0];
  const q2 = `SELECT id, name FROM barbers WHERE name ILIKE $1 LIMIT 1`;
  const r2 = await pool.query(q2, [`%${name}%`]);
  return r2.rowCount ? r2.rows[0] : null;
}

async function findBarberFromReviewCandidates(name) {
  if (!name) return null;
  const q = `
    SELECT rnc.matched_barber_id AS id, b.name
    FROM review_name_candidates rnc
    JOIN barbers b ON b.id = rnc.matched_barber_id
    WHERE rnc.normalized_name ILIKE $1 OR rnc.candidate_name ILIKE $1
    ORDER BY rnc.confidence DESC NULLS LAST LIMIT 1
  `;
  const r = await pool.query(q, [`%${name}%`]);
  return r.rowCount ? r.rows[0] : null;
}

async function insertBarber({ name, source = 'reconciler', metadata = {} }) {
  const q = `INSERT INTO barbers (name, trust_score, metadata, created_at, updated_at) VALUES ($1,$2,$3, now(), now()) RETURNING *`;
  const r = await pool.query(q, [name || null, 0, metadata || {}]);
  return r.rows[0];
}

async function insertBarberSocialLink({ barber_id, social_profile_id, confidence = 0, evidence = {}, role = null }) {
  const q = `INSERT INTO barber_social_links (barber_id, social_profile_id, role, confidence, evidence, created_at, updated_at) VALUES ($1,$2,$3,$4,$5, now(), now()) RETURNING *`;
  const r = await pool.query(q, [barber_id, social_profile_id, role, confidence, evidence || {}]);
  return r.rows[0];
}

function scoreMatch(sp, candidateBarber, heuristics = {}) {
  // Basic score combining social profile confidence and heuristics
  let score = Number(sp.confidence || 0);
  if (candidateBarber && heuristics.nameExact) score += 0.15;
  if (heuristics.fromReview) score += 0.12;
  // cap
  return Math.min(0.99, score);
}

async function reconcileOne(sp) {
  try {
    const evidence = sp.evidence || {};
    // check for explicit yelp_business evidence
    const yelpBusiness = (evidence && (evidence.yelp_business || (evidence.source_record && evidence.source_record.yelp_business))) || null;
    let barber = null;
    let heur = {};

    if (yelpBusiness) {
      barber = await findBarberByYelpId(String(yelpBusiness));
      heur.byYelp = !!barber;
    }

    // try name-based lookup if not found
    if (!barber && sp.name) {
      const byName = await findBarberByExactName(sp.name);
      if (byName) { barber = byName; heur.nameExact = true; }
    }

    // try review_name_candidates match
    if (!barber && sp.name) {
      const byReviews = await findBarberFromReviewCandidates(sp.name);
      if (byReviews) { barber = byReviews; heur.fromReview = true; }
    }

    // Use LLM verifier as tie-breaker for ambiguous candidates (best-effort)
    let llmVerification = null;
    try {
      // pass candidate object structure expected by verifyCandidate
      const candidate = { handles: [], urls: sp.profile_url ? [sp.profile_url] : [], name: sp.name, source_record: sp.evidence || {} };
      const verification = await verifyCandidate(candidate).catch(() => null);
      llmVerification = verification || null;
      if (!barber && verification && verification.heuristic && verification.heuristic.evidence && verification.heuristic.evidence.length) {
        // heuristic evidence may point to a platform/owner; no direct barber id, but we can bump confidence
      }
    } catch (e) {
      // ignore verifier failures
    }

    const matchScore = scoreMatch(sp, barber, heur);

    // decide linking
    if (barber && matchScore >= 0.55) {
      const link = await insertBarberSocialLink({ barber_id: barber.id, social_profile_id: sp.id, confidence: matchScore, evidence: { reconciler: true, heuristics: heur, llm: llmVerification } });
      return { action: 'linked', barber_id: barber.id, social_profile_id: sp.id, link };
    }

    // create barber when very high confidence from profile alone
    if (!barber && Number(sp.confidence || 0) >= 0.95) {
      const created = await insertBarber({ name: sp.name || sp.handle || `Barber ${sp.id}`, source: 'reconciler', metadata: { created_from_social_profile: true, social_profile_id: sp.id } });
      const link = await insertBarberSocialLink({ barber_id: created.id, social_profile_id: sp.id, confidence: Number(sp.confidence || 0), evidence: { reconciler: true, created: true } });
      return { action: 'created_and_linked', barber_id: created.id, social_profile_id: sp.id, created, link };
    }

    return { action: 'no_match', social_profile_id: sp.id, matchScore, heuristics: heur };
  } catch (e) {
    return { action: 'error', social_profile_id: sp.id, error: String(e && e.message ? e.message : e) };
  }
}

async function reconcile({ limit = DEFAULT_LIMIT } = {}) {
  console.log(`Barber reconciler starting (limit=${limit})`);
  const profiles = await fetchUnlinkedProfiles(limit);
  console.log(`Found ${profiles.length} unlinked social profiles to consider`);
  const results = [];
  for (const sp of profiles) {
    console.log(`Processing social_profile id=${sp.id} name=${sp.name} confidence=${sp.confidence}`);
    const r = await reconcileOne(sp);
    console.log(' ->', r.action, r.error ? r.error : '');
    results.push(r);
  }
  return results;
}

if (require.main === module) {
  (async () => {
    try {
      const argv = process.argv.slice(2);
      const opts = { limit: DEFAULT_LIMIT };
      for (const a of argv) {
        if (a.startsWith('--limit=')) opts.limit = Number(a.split('=')[1]) || DEFAULT_LIMIT;
      }
      const out = await reconcile(opts);
      console.log('Reconciler done. Results:', out.length);
      await pool.end();
      process.exit(0);
    } catch (e) {
      console.error('Reconciler fatal', e.message || e);
      try { await pool.end(); } catch (e) {}
      process.exit(1);
    }
  })();
}

module.exports = { reconcile };
