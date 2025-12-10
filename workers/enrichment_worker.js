/**
 * workers/enrichment_worker.js
 *
 * Background worker for enriching reviews with local LLM (Ollama + Llama 3.2).
 * Processes pending reviews: extracts names, computes sentiment, generates summaries.
 * Falls back to heuristics if Ollama unavailable.
 *
 * Usage (from root):
 *   node workers/enrichment_worker.js --pending        # Process unprocessed reviews
 *   node workers/enrichment_worker.js --all            # Re-process all reviews
 *   node workers/enrichment_worker.js --sample         # Test with sample data (offline)
 */

require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');
const { parseReview } = require('./llm/review_parser.js');
const { extractAdjectivesFromReview } = require('./llm/ollama_client');
const { checkOllama } = require('./llm/ollama_client.js');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rateyourbarber'
});

/**
 * Test mode: Run enrichment on sample reviews (no DB)
 */
async function runSampleMode() {
  console.log('Running enrichment worker in SAMPLE mode (offline)...\n');

  const samples = [
    { id: 1, text: 'Tony gave me an amazing fade! Best barber in SF.', shop_name: 'Classic Cuts' },
    { id: 2, text: 'Worst haircut ever. Very disappointed with the service.', shop_name: 'Budget Barbers' },
    { id: 3, text: 'Maria is incredibly talented. She nailed my pompadour. Highly recommend!', shop_name: 'Style Studio' },
    { id: 4, text: 'Great experience overall. Clean shop and professional service.', shop_name: 'Downtown Barbershop' }
  ];

  console.log('Checking Ollama availability...');
  const ollamaStatus = await checkOllama();
  console.log(`${ollamaStatus.available ? '✓' : '✗'} ${ollamaStatus.message}\n`);

  console.log(`Processing ${samples.length} sample reviews...\n`);

  for (const sample of samples) {
    console.log(`[${sample.id}] "${sample.text}"`);
    try {
      const parsed = await parseReview(sample.text, sample.shop_name);
      console.log(`  → Sentiment: ${parsed.sentiment.toFixed(2)}, Names: [${parsed.names.join(', ')}]`);
      console.log(`  → Summary: "${parsed.summary}"\n`);
    } catch (err) {
      console.error(`  ERROR: ${err.message}\n`);
    }
  }

  console.log('Sample mode complete. (No database changes.)');
}

/**
 * Fetch pending reviews (enriched_at IS NULL)
 */
async function fetchPendingReviews(limit = 100) {
  const query = `
    SELECT r.id, r.barber_id, r.text, r.sentiment_score, r.created_at, s.name as shop_name
    FROM reviews r
    LEFT JOIN shops s ON r.shop_id = s.id
    WHERE r.enriched_at IS NULL
    AND r.text IS NOT NULL
    AND r.text != ''
    ORDER BY r.created_at DESC
    LIMIT $1;
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
}

/**
 * Fetch all reviews (for re-processing)
 */
async function fetchAllReviews(limit = 100) {
  const query = `
    SELECT r.id, r.text, r.sentiment_score, r.created_at, s.name as shop_name
    FROM reviews r
    LEFT JOIN shops s ON r.shop_id = s.id
    WHERE r.text IS NOT NULL
    AND r.text != ''
    ORDER BY r.created_at DESC
    LIMIT $1;
  `;
  const result = await db.query(query, [limit]);
  return result.rows;
}

/**
 * Persist enriched review data
 */
async function updateReviewEnrichment(reviewId, enrichmentData) {
  const query = `
    UPDATE reviews
    SET
      extracted_names = $1,
      review_summary = $2,
      enriched_at = NOW(),
      prefilter_flags = $3,
      prefilter_details = $4,
      adjectives = $5,
      enriched_sentiment = $6,
      sentiment_score = $7
    WHERE id = $8;
  `;
  await db.query(query, [
    enrichmentData.names ? enrichmentData.names.join(', ') : null,
    enrichmentData.summary || null,
    enrichmentData.prefilter ? JSON.stringify(enrichmentData.prefilter.flags || {}) : null,
    enrichmentData.prefilter ? JSON.stringify(enrichmentData.prefilter.details || {}) : null,
    enrichmentData.adjectives ? JSON.stringify(enrichmentData.adjectives) : null,
    typeof enrichmentData.sentiment === 'number' ? enrichmentData.sentiment : null,
    typeof enrichmentData.sentiment_score === 'number' ? enrichmentData.sentiment_score : null,
    reviewId
  ]);
}

async function updateReviewLanguage(reviewId, language, confidence) {
  const q = `UPDATE reviews SET language = $1, language_confidence = $2 WHERE id = $3`;
  await db.query(q, [language, confidence, reviewId]);
}

async function aggregateBarberLanguages(barberId) {
  // Aggregate language counts from reviews for the barber and store top languages into barbers.languages
  const q = `
    SELECT language, COUNT(*) AS cnt
    FROM reviews
    WHERE barber_id = $1 AND language IS NOT NULL
    GROUP BY language
    ORDER BY cnt DESC
  `;
  const res = await db.query(q, [barberId]);
  const langs = res.rows.map(r => ({ lang: r.language, count: Number(r.cnt) }));
  const up = `UPDATE barbers SET languages = $1 WHERE id = $2`;
  await db.query(up, [JSON.stringify(langs), barberId]);
}

async function aggregateBarberAdjectives(barberId) {
  // Count adjective frequencies from reviews for the barber and store top adjectives into barbers.adjectives
  const q = `
    SELECT jsonb_array_elements_text(adjectives) as adj, COUNT(*) AS cnt
    FROM reviews
    WHERE barber_id = $1 AND adjectives IS NOT NULL
    GROUP BY adj
    ORDER BY cnt DESC
  `;
  const res = await db.query(q, [barberId]);
  const adjs = res.rows.map(r => ({ adjective: r.adj, count: Number(r.cnt) }));
  const up = `UPDATE barbers SET adjectives = $1 WHERE id = $2`;
  await db.query(up, [JSON.stringify(adjs), barberId]);
}

/**
 * Main enrichment loop
 */
async function enrichReviews(allReviews = false) {
  console.log(`Starting enrichment worker (${allReviews ? 'ALL' : 'PENDING'} reviews)...\n`);

  const ollamaStatus = await checkOllama();
  console.log(`Ollama status: ${ollamaStatus.available ? '✓ Available' : '✗ Unavailable (using heuristics)'}\n`);

  let reviews;
  try {
    reviews = allReviews ? await fetchAllReviews(500) : await fetchPendingReviews(500);
  } catch (err) {
    console.error(`Database error: ${err.message}`);
    process.exit(1);
  }

  if (reviews.length === 0) {
    console.log('No reviews to process.');
    await db.end();
    return;
  }

  console.log(`Processing ${reviews.length} review(s)...\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const review of reviews) {
    try {
      console.log(`[${review.id}] Enriching...`);
      const parsed = await parseReview(review.text, review.shop_name);
      // extract adjectives (LLM or fallback)
      try {
        const adjs = await extractAdjectivesFromReview(review.text || '');
        parsed.adjectives = adjs;
      } catch (e) {
        parsed.adjectives = [];
      }

      // Compute adjective sentiment bonus: positive adjectives +0.05, negative adjectives -0.04
      const positiveAdj = new Set(['amazing','excellent','great','perfect','fantastic','brilliant','wonderful','best','impressed','highly recommend','very satisfied','skilled','talented','professional','clean','friendly','quick','precise','crisp','detailed']);
      const negativeAdj = new Set(['rude','bad','terrible','awful','mediocre','disappointed','poor','slow','expensive','cheap','waste']);
      let adjBonus = 0;
      for (const a of parsed.adjectives || []) {
        const key = (''+a).toLowerCase().trim();
        if (positiveAdj.has(key)) adjBonus += 0.05;
        else if (negativeAdj.has(key)) adjBonus -= 0.04;
      }
      // Adjusted sentiment score (float). Base parsed.sentiment is -1/0/1.
      parsed.sentiment_score = (typeof parsed.sentiment === 'number') ? (parsed.sentiment + adjBonus) : adjBonus;

      await updateReviewEnrichment(review.id, parsed);
      // persist detected language on review and update barber aggregate
      if (parsed.language) {
        await updateReviewLanguage(review.id, parsed.language, parsed.language_confidence || 0);
      }
      if (review.barber_id) {
        try {
          await aggregateBarberLanguages(review.barber_id);
          // also aggregate adjectives
          try { await aggregateBarberAdjectives(review.barber_id); } catch (e) { console.warn('Adjective aggregation failed', e.message || e); }
        } catch (agErr) {
          console.warn('Failed to aggregate barber languages for barber', review.barber_id, agErr.message || agErr);
        }
      }
      console.log(`  ✓ Sentiment: ${parsed.sentiment.toFixed(2)}, Names: [${parsed.names.join(', ')}]`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Error: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Processed: ${reviews.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${errorCount}`);

  await db.end();
}

/**
 * Parse CLI arguments and run
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--sample')) {
    await runSampleMode();
  } else if (args.includes('--all')) {
    await enrichReviews(true);
  } else if (args.includes('--pending') || args.length === 0) {
    await enrichReviews(false);
  } else {
    console.log(`
Enrichment Worker — Local LLM Review Processing

Usage:
  node workers/enrichment_worker.js --pending      Process reviews where enriched_at IS NULL (default)
  node workers/enrichment_worker.js --all          Re-process all reviews
  node workers/enrichment_worker.js --sample       Test mode: sample reviews, no DB (offline)

Environment:
  DATABASE_URL                 PostgreSQL connection string
  OLLAMA_ENDPOINT              Ollama API endpoint (default: http://localhost:11434)
  OLLAMA_MODEL                 Ollama model name (default: llama3.2:3b)

Examples:
  # First time: enrich pending reviews
  node workers/enrichment_worker.js --pending

  # Later: re-enrich everything (slower)
  node workers/enrichment_worker.js --all

  # Test without database
  node workers/enrichment_worker.js --sample
    `);
  }
}

main().catch(err => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
