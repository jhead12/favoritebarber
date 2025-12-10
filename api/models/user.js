/**
 * api/models/user.js
 * User account management, favorites, and review operations
 */

const { pool } = require('../db.js');

/**
 * Create a new user account
 */
async function createUser(email, username, passwordHash) {
  const query = `
    INSERT INTO users (email, username, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, email, username, created_at;
  `;
  const result = await pool.query(query, [email, username, passwordHash]);
  return result.rows[0];
}

/**
 * Get user by email
 */
async function getUserByEmail(email) {
  const query = `
    SELECT id, email, username, password_hash, profile_image_url, bio, created_at
    FROM users
    WHERE email = $1;
  `;
  const result = await pool.query(query, [email]);
  return result.rows[0];
}

/**
 * Get user by ID
 */
async function getUserById(userId) {
  const query = `
    SELECT id, email, username, profile_image_url, bio, created_at
    FROM users
    WHERE id = $1;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows[0];
}

/**
 * Add barber to user favorites
 */
async function addFavorite(userId, shopId, barberId = null, notes = null) {
  const query = `
    INSERT INTO user_favorites (user_id, shop_id, barber_id, notes)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id, shop_id, barber_id) DO UPDATE SET notes = EXCLUDED.notes
    RETURNING id, user_id, shop_id, barber_id, saved_at;
  `;
  const result = await pool.query(query, [userId, shopId, barberId, notes]);
  return result.rows[0];
}

/**
 * Remove from favorites
 */
async function removeFavorite(userId, shopId, barberId = null) {
  const query = `
    DELETE FROM user_favorites
    WHERE user_id = $1 AND shop_id = $2 AND (barber_id = $3 OR ($3 IS NULL AND barber_id IS NULL))
    RETURNING id;
  `;
  const result = await pool.query(query, [userId, shopId, barberId]);
  return result.rows[0];
}

/**
 * Get user's favorites
 */
async function getUserFavorites(userId) {
  const query = `
    SELECT 
      uf.id,
      uf.shop_id,
      s.name as shop_name,
      uf.barber_id,
      b.name as barber_name,
      uf.notes,
      uf.saved_at
    FROM user_favorites uf
    LEFT JOIN shops s ON uf.shop_id = s.id
    LEFT JOIN barbers b ON uf.barber_id = b.id
    WHERE uf.user_id = $1
    ORDER BY uf.saved_at DESC;
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

/**
 * Create a user review
 */
async function createUserReview(userId, shopId, barberId, reviewData) {
  const {
    title,
    text,
    rating,
    hairstyleRequested,
    pricePaid,
    wouldReturn
  } = reviewData;

  const query = `
    INSERT INTO user_reviews 
    (user_id, shop_id, barber_id, title, text, rating, hairstyle_requested, price_paid, would_return)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id, user_id, shop_id, barber_id, rating, created_at;
  `;

  const result = await pool.query(query, [
    userId, shopId, barberId, title, text, rating,
    hairstyleRequested, pricePaid, wouldReturn
  ]);

  const reviewId = result.rows[0].id;

  // Compute initial score
  await computeReviewScore(reviewId);

  return result.rows[0];
}

/**
 * Get reviews for a barber
 */
async function getBarberUserReviews(barberId, limit = 20, offset = 0) {
  const query = `
    SELECT 
      ur.id,
      ur.title,
      ur.text,
      ur.rating,
      ur.hairstyle_requested,
      ur.price_paid,
      ur.would_return,
      ur.helpful_count,
      ur.unhelpful_count,
      u.username,
      u.profile_image_url,
      rs.total_score as review_score,
      ROUND(ur.helpful_count::NUMERIC / NULLIF(ur.helpful_count + ur.unhelpful_count, 0) * 100, 2) as helpfulness_percent,
      ur.created_at
    FROM user_reviews ur
    LEFT JOIN users u ON ur.user_id = u.id
    LEFT JOIN review_scores rs ON ur.id = rs.review_id
    WHERE ur.barber_id = $1 AND ur.published = TRUE
    ORDER BY rs.total_score DESC, ur.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [barberId, limit, offset]);
  return result.rows;
}

/**
 * Get reviews for a shop
 */
async function getShopUserReviews(shopId, limit = 20, offset = 0) {
  const query = `
    SELECT 
      ur.id,
      ur.title,
      ur.text,
      ur.rating,
      ur.barber_id,
      b.name as barber_name,
      ur.hairstyle_requested,
      ur.price_paid,
      ur.would_return,
      ur.helpful_count,
      ur.unhelpful_count,
      u.username,
      u.profile_image_url,
      rs.total_score as review_score,
      ur.created_at
    FROM user_reviews ur
    LEFT JOIN users u ON ur.user_id = u.id
    LEFT JOIN barbers b ON ur.barber_id = b.id
    LEFT JOIN review_scores rs ON ur.id = rs.review_id
    WHERE ur.shop_id = $1 AND ur.published = TRUE
    ORDER BY rs.total_score DESC, ur.created_at DESC
    LIMIT $2 OFFSET $3;
  `;
  const result = await pool.query(query, [shopId, limit, offset]);
  return result.rows;
}

/**
 * Mark review as helpful/unhelpful
 */
async function markReviewHelpful(userId, reviewId, isHelpful) {
  const query = `
    INSERT INTO review_helpfulness (user_id, review_id, is_helpful)
    VALUES ($1, $2, $3)
    ON CONFLICT (user_id, review_id) DO UPDATE SET is_helpful = EXCLUDED.is_helpful
    RETURNING id;
  `;
  await pool.query(query, [userId, reviewId, isHelpful]);

  // Update review helpfulness counts
  const updateQuery = `
    UPDATE user_reviews
    SET 
      helpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = $1 AND is_helpful = TRUE),
      unhelpful_count = (SELECT COUNT(*) FROM review_helpfulness WHERE review_id = $1 AND is_helpful = FALSE)
    WHERE id = $1;
  `;
  await pool.query(updateQuery, [reviewId]);

  // Recompute review score
  await computeReviewScore(reviewId);
}

/**
 * Compute review credibility score
 * Factors: rating, helpfulness, detail level, recency, user reputation
 */
async function computeReviewScore(reviewId) {
  const query = `
    WITH review_data AS (
      SELECT 
        ur.id,
        ur.rating,
        ur.text,
        ur.hairstyle_requested,
        ur.price_paid,
        ur.helpful_count,
        ur.unhelpful_count,
        ur.created_at,
        ur.user_id,
        LENGTH(ur.text) as text_length,
        EXTRACT(DAY FROM NOW() - ur.created_at) as days_old
      FROM user_reviews ur
      WHERE ur.id = $1
    ),
    helpfulness_calc AS (
      SELECT 
        rd.id,
        CASE 
          WHEN (rd.helpful_count + rd.unhelpful_count) = 0 THEN 50
          ELSE ROUND((rd.helpful_count::NUMERIC / (rd.helpful_count + rd.unhelpful_count)) * 100)
        END as helpfulness_score,
        CASE 
          WHEN rd.text_length > 200 THEN 20
          WHEN rd.text_length > 100 THEN 15
          WHEN rd.text_length > 50 THEN 10
          ELSE 5
        END as detail_score,
        CASE 
          WHEN rd.hairstyle_requested IS NOT NULL THEN 10
          ELSE 0
        END as hairstyle_bonus,
        CASE 
          WHEN rd.price_paid IS NOT NULL THEN 10
          ELSE 0
        END as price_bonus,
        CASE 
          WHEN rd.days_old <= 7 THEN 20
          WHEN rd.days_old <= 30 THEN 15
          WHEN rd.days_old <= 90 THEN 10
          ELSE 5
        END as recency_score
      FROM review_data rd
    )
    UPDATE review_scores
    SET 
      helpfulness_score = hc.helpfulness_score,
      detail_score = hc.detail_score + hc.hairstyle_bonus + hc.price_bonus,
      recency_score = hc.recency_score,
      rating_weight = rd.rating * 20,
      total_score = LEAST(100, hc.helpfulness_score + hc.detail_score + hc.hairstyle_bonus + hc.price_bonus + hc.recency_score + (rd.rating * 20) / 5),
      computed_at = NOW()
    FROM helpfulness_calc hc
    CROSS JOIN review_data rd
    WHERE review_scores.review_id = $1;
  `;

  // Insert if doesn't exist
  await pool.query(query, [reviewId]);

  // Ensure record exists
  const insertQuery = `
    INSERT INTO review_scores (review_id)
    VALUES ($1)
    ON CONFLICT (review_id) DO NOTHING;
  `;
  await pool.query(insertQuery, [reviewId]);

  // Recompute if insert didn't trigger update
  await pool.query(query, [reviewId]);
}

/**
 * Compute barber aggregate scores
 */
async function computeBarberScore(barberId) {
  const query = `
    WITH user_reviews_stats AS (
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as review_count,
        SUM(CASE WHEN would_return = TRUE THEN 1 ELSE 0 END)::NUMERIC / COUNT(*) * 100 as would_return_pct
      FROM user_reviews
      WHERE barber_id = $1
    ),
    recent_reviews AS (
      SELECT COUNT(*) as recent_count
      FROM user_reviews
      WHERE barber_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    ),
    yelp_stats AS (
      SELECT 
        AVG(CAST(rating AS NUMERIC)) as yelp_avg_rating,
        COUNT(*) as yelp_count,
        AVG(sentiment_score) as avg_sentiment
      FROM reviews
      WHERE barber_id = $1
    )
    INSERT INTO barber_scores (barber_id, user_rating_avg, user_review_count, would_return_percentage, yelp_rating, yelp_review_count, yelp_sentiment_avg, recent_reviews_count, trust_score, computed_at)
    SELECT 
      $1,
      urs.avg_rating,
      urs.review_count,
      urs.would_return_pct,
      ys.yelp_avg_rating,
      ys.yelp_count,
      ys.avg_sentiment,
      rr.recent_count,
      LEAST(100, COALESCE(urs.avg_rating * 20, 0) + COALESCE(ys.avg_sentiment * 30, 0) + CASE WHEN rr.recent_count > 0 THEN 20 ELSE 0 END),
      NOW()
    FROM user_reviews_stats urs
    CROSS JOIN recent_reviews rr
    CROSS JOIN yelp_stats ys
    ON CONFLICT (barber_id) DO UPDATE SET
      user_rating_avg = EXCLUDED.user_rating_avg,
      user_review_count = EXCLUDED.user_review_count,
      would_return_percentage = EXCLUDED.would_return_percentage,
      yelp_rating = EXCLUDED.yelp_rating,
      yelp_review_count = EXCLUDED.yelp_review_count,
      yelp_sentiment_avg = EXCLUDED.yelp_sentiment_avg,
      recent_reviews_count = EXCLUDED.recent_reviews_count,
      trust_score = EXCLUDED.trust_score,
      trending = EXCLUDED.recent_reviews_count > 3,
      computed_at = NOW();
  `;

  await pool.query(query, [barberId]);
}

/**
 * Search user reviews by hairstyle or keyword
 */
async function searchUserReviews(shopId, searchTerm, limit = 20) {
  const query = `
    SELECT 
      ur.id,
      ur.title,
      ur.text,
      ur.rating,
      ur.hairstyle_requested,
      ur.would_return,
      b.name as barber_name,
      u.username,
      rs.total_score,
      ur.created_at
    FROM user_reviews ur
    LEFT JOIN users u ON ur.user_id = u.id
    LEFT JOIN barbers b ON ur.barber_id = b.id
    LEFT JOIN review_scores rs ON ur.id = rs.review_id
    WHERE ur.shop_id = $1 
      AND ur.published = TRUE
      AND (
        ur.hairstyle_requested ILIKE '%' || $2 || '%'
        OR ur.text ILIKE '%' || $2 || '%'
        OR ur.title ILIKE '%' || $2 || '%'
      )
    ORDER BY rs.total_score DESC, ur.created_at DESC
    LIMIT $3;
  `;
  const result = await pool.query(query, [shopId, searchTerm, limit]);
  return result.rows;
}

module.exports = {
  createUser,
  getUserByEmail,
  getUserById,
  addFavorite,
  removeFavorite,
  getUserFavorites,
  createUserReview,
  getBarberUserReviews,
  getShopUserReviews,
  markReviewHelpful,
  computeReviewScore,
  computeBarberScore,
  searchUserReviews
};
