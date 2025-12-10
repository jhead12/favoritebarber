/**
 * api/jobs/scoreRecomputation.js
 * Periodic background jobs for recomputing review and barber scores
 */

const cron = require('node-cron');
const { pool } = require('../db');

/**
 * Recompute review score for a specific review
 */
async function computeReviewScore(reviewId) {
  try {
    const query = `
      WITH review_data AS (
        SELECT 
          ur.id,
          ur.rating,
          ur.created_at,
          COALESCE(COUNT(rh.id) FILTER (WHERE rh.is_helpful = TRUE), 0) as helpful_votes,
          COALESCE(COUNT(rh.id) FILTER (WHERE rh.is_helpful = FALSE), 0) as unhelpful_votes,
          COALESCE(COUNT(rh.id), 0) as total_votes,
          LENGTH(ur.text) as text_length,
          CASE WHEN ur.hairstyle_requested IS NOT NULL THEN 1 ELSE 0 END as has_hairstyle,
          CASE WHEN ur.price_paid IS NOT NULL THEN 1 ELSE 0 END as has_price
        FROM user_reviews ur
        LEFT JOIN review_helpfulness rh ON ur.id = rh.review_id
        WHERE ur.id = $1
        GROUP BY ur.id, ur.rating, ur.created_at, ur.text, ur.hairstyle_requested, ur.price_paid
      ),
      scoring AS (
        SELECT
          id,
          CASE 
            WHEN total_votes > 0 
            THEN GREATEST(0, LEAST(100, (helpful_votes::FLOAT / total_votes) * 100))
            ELSE 50
          END as helpfulness_score,
          CASE 
            WHEN text_length > 500 THEN 100
            WHEN text_length > 200 THEN 80
            WHEN text_length > 50 THEN 50
            ELSE 20
          END +
          (has_hairstyle * 20) +
          (has_price * 20) as detail_score,
          CASE 
            WHEN EXTRACT(DAY FROM NOW() - created_at) < 7 THEN 100
            WHEN EXTRACT(DAY FROM NOW() - created_at) < 30 THEN 80
            WHEN EXTRACT(DAY FROM NOW() - created_at) < 90 THEN 50
            ELSE 20
          END as recency_score,
          (rating / 5.0) * 100 as rating_weight,
          50 as user_reputation
        FROM review_data
      )
      UPDATE review_scores
      SET 
        helpfulness_score = (SELECT helpfulness_score FROM scoring),
        detail_score = LEAST(100, (SELECT detail_score FROM scoring)),
        recency_score = (SELECT recency_score FROM scoring),
        rating_weight = (SELECT rating_weight FROM scoring),
        user_reputation = (SELECT user_reputation FROM scoring),
        total_score = (
          (SELECT helpfulness_score FROM scoring) * 0.30 +
          LEAST(100, (SELECT detail_score FROM scoring)) * 0.20 +
          (SELECT recency_score FROM scoring) * 0.15 +
          (SELECT rating_weight FROM scoring) * 0.20 +
          (SELECT user_reputation FROM scoring) * 0.15
        ),
        computed_at = NOW()
      WHERE review_id = $1;
    `;

    await pool.query(query, [reviewId]);
  } catch (err) {
    console.error(`Error computing review score for review ${reviewId}:`, err);
  }
}

/**
 * Recompute barber score - aggregates from user reviews and Yelp data
 */
async function computeBarberScore(barberId) {
  try {
    const query = `
      WITH barber_stats AS (
        SELECT
          b.id,
          COALESCE(AVG(ur.rating), 0) as user_rating_avg,
          COUNT(ur.id) as user_review_count,
          COALESCE(SUM(CASE WHEN ur.would_return THEN 1 ELSE 0 END)::FLOAT / NULLIF(COUNT(ur.id), 0) * 100, 0) as would_return_pct,
          COUNT(ur.id) FILTER (WHERE ur.created_at > NOW() - INTERVAL '30 days') as recent_reviews_count,
          COALESCE(AVG(rs.total_score), 50) as avg_review_credibility
        FROM barbers b
        LEFT JOIN user_reviews ur ON b.id = ur.barber_id
        LEFT JOIN review_scores rs ON ur.id = rs.review_id
        WHERE b.id = $1
        GROUP BY b.id
      ),
      scoring AS (
        SELECT
          id,
          user_rating_avg,
          user_review_count,
          would_return_pct,
          recent_reviews_count,
          CASE
            WHEN recent_reviews_count > 10 THEN TRUE
            WHEN recent_reviews_count >= 5 THEN TRUE
            ELSE FALSE
          END as is_trending,
          LEAST(100, (
            user_rating_avg * 20 +
            0 * 20 +
            0 * 30 +
            would_return_pct / 5 +
            10
          )) as trust_score
        FROM barber_stats
      )
      UPDATE barber_scores
      SET
        user_rating_avg = (SELECT user_rating_avg FROM scoring),
        user_review_count = (SELECT user_review_count FROM scoring),
        yelp_rating = COALESCE(yelp_rating, 0),
        yelp_review_count = COALESCE(yelp_review_count, 0),
        would_return_percentage = (SELECT would_return_pct FROM scoring),
        trust_score = (SELECT trust_score FROM scoring),
        recent_reviews_count = (SELECT recent_reviews_count FROM scoring),
        trending = (SELECT is_trending FROM scoring),
        computed_at = NOW()
      WHERE barber_id = $1;
    `;

    await pool.query(query, [barberId]);
  } catch (err) {
    console.error(`Error computing barber score for barber ${barberId}:`, err);
  }
}

/**
 * Recompute all review scores (called periodically)
 */
async function recomputeAllReviewScores() {
  console.log('[JOBS] Starting review score recomputation...');
  try {
    const result = await pool.query(
      'SELECT id FROM user_reviews WHERE created_at > NOW() - INTERVAL \'7 days\' ORDER BY updated_at DESC LIMIT 1000'
    );

    for (const row of result.rows) {
      await computeReviewScore(row.id);
    }

    console.log(`[JOBS] Recomputed ${result.rows.length} review scores`);
  } catch (err) {
    console.error('[JOBS] Error recomputing all review scores:', err);
  }
}

/**
 * Recompute all barber scores (called periodically)
 */
async function recomputeAllBarberScores() {
  console.log('[JOBS] Starting barber score recomputation...');
  try {
    const result = await pool.query(
      `SELECT DISTINCT b.id 
       FROM barbers b 
       LEFT JOIN user_reviews ur ON b.id = ur.barber_id 
       WHERE ur.created_at > NOW() - INTERVAL '7 days' 
       OR b.updated_at > NOW() - INTERVAL '7 days'`
    );

    for (const row of result.rows) {
      await computeBarberScore(row.id);
    }

    console.log(`[JOBS] Recomputed ${result.rows.length} barber scores`);
  } catch (err) {
    console.error('[JOBS] Error recomputing all barber scores:', err);
  }
}

/**
 * Initialize background jobs
 */
function initializeJobs() {
  console.log('[JOBS] Initializing background jobs...');

  // Recompute review scores every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    await recomputeAllReviewScores();
  });

  // Recompute barber scores every hour
  cron.schedule('0 * * * *', async () => {
    await recomputeAllBarberScores();
  });

  // Run initial computation on startup (delayed by 5 seconds)
  setTimeout(async () => {
    console.log('[JOBS] Running initial score computation...');
    await recomputeAllReviewScores();
    await recomputeAllBarberScores();
  }, 5000);

  console.log('[JOBS] Background jobs initialized');
}

module.exports = {
  initializeJobs,
  computeReviewScore,
  computeBarberScore,
  recomputeAllReviewScores,
  recomputeAllBarberScores,
};
