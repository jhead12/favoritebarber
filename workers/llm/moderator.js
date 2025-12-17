/**
 * LLM-Powered Review Moderator
 * 
 * Detects:
 * - Spam/fake reviews
 * - Coordinated attack patterns
 * - Inappropriate content
 * 
 * Uses multi-provider LLM system for analysis.
 */

const { llm_client } = require('./llm_client');
const db = require('../../api/db');
const { logger } = require('../../api/lib/logger');

/**
 * Moderate a single review with LLM analysis
 * 
 * @param {string} reviewText - The review content to analyze
 * @param {Object} metadata - Additional context (barber_id, user_id, timestamp)
 * @returns {Object} Moderation result { is_spam, is_fake, is_attack, is_inappropriate, confidence, reason }
 */
async function moderateReview(reviewText, metadata = {}) {
  if (!reviewText || reviewText.trim().length === 0) {
    return {
      is_spam: false,
      is_fake: false,
      is_attack: false,
      is_inappropriate: false,
      confidence: 1.0,
      reason: 'Empty review - no content to moderate'
    };
  }

  // Build prompt with context
  const prompt = buildModerationPrompt(reviewText, metadata);

  try {
    // Call LLM with low temperature for consistent moderation
    const response = await llm_client.call(prompt, {
      temperature: 0.1, // Very low for consistency
      max_tokens: 200,
      model: process.env.MODERATION_MODEL || 'gpt-4o-mini' // Fast, cheap model
    });

    // Parse LLM response
    const result = parseModerationResponse(response);
    
    logger.info('Review moderation complete', {
      review_length: reviewText.length,
      is_spam: result.is_spam,
      is_fake: result.is_fake,
      confidence: result.confidence
    });

    return result;

  } catch (error) {
    logger.error('Review moderation failed', { error: error.message });
    
    // Fallback to heuristics on LLM failure
    return fallbackModerationHeuristics(reviewText);
  }
}

/**
 * Build moderation prompt for LLM
 */
function buildModerationPrompt(reviewText, metadata) {
  const contextInfo = [];
  
  if (metadata.barber_name) {
    contextInfo.push(`Barber: ${metadata.barber_name}`);
  }
  if (metadata.shop_name) {
    contextInfo.push(`Shop: ${metadata.shop_name}`);
  }
  if (metadata.review_date) {
    contextInfo.push(`Date: ${metadata.review_date}`);
  }

  const context = contextInfo.length > 0 ? `\n\nContext: ${contextInfo.join(', ')}` : '';

  return `You are a content moderator for a barber review platform. Analyze this review for spam, fake content, coordinated attacks, or inappropriate content.

Review Text: "${reviewText}"${context}

Detect these issues:

1. **is_spam**: Promotional content, external links, solicitation, promo codes, calls to action, advertising other businesses
2. **is_fake**: Bot-generated, template-like, generic praise/criticism with no specific details, copy-pasted content
3. **is_attack**: Coordinated negative/positive campaign, suspiciously extreme sentiment, competitor sabotage patterns
4. **is_inappropriate**: Harassment, threats, doxxing, hate speech, personal attacks unrelated to service quality

Return ONLY valid JSON (no markdown, no extra text):
{
  "is_spam": true/false,
  "is_fake": true/false,
  "is_attack": true/false,
  "is_inappropriate": true/false,
  "confidence": 0.0-1.0,
  "reason": "brief explanation of detection"
}`;
}

/**
 * Parse LLM moderation response
 */
function parseModerationResponse(responseText) {
  try {
    // Remove markdown code blocks if present
    let cleaned = responseText.trim();
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '');
    
    const parsed = JSON.parse(cleaned);
    
    // Validate structure
    return {
      is_spam: !!parsed.is_spam,
      is_fake: !!parsed.is_fake,
      is_attack: !!parsed.is_attack,
      is_inappropriate: !!parsed.is_inappropriate,
      confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
      reason: String(parsed.reason || 'No reason provided')
    };

  } catch (error) {
    logger.error('Failed to parse moderation response', { 
      error: error.message, 
      response: responseText 
    });
    
    // Return conservative default
    return {
      is_spam: false,
      is_fake: false,
      is_attack: false,
      is_inappropriate: false,
      confidence: 0.3,
      reason: 'Parse error - review manually'
    };
  }
}

/**
 * Fallback heuristic moderation when LLM fails
 */
function fallbackModerationHeuristics(reviewText) {
  const lower = reviewText.toLowerCase();
  
  // Spam indicators
  const spamKeywords = ['buy now', 'click here', 'visit', 'promo code', 'discount', 'special offer', 'limited time', 'http://', 'https://', '.com', 'www.'];
  const hasSpam = spamKeywords.some(kw => lower.includes(kw));
  
  // Fake indicators
  const isTooShort = reviewText.trim().length < 15;
  const isGeneric = /^(great|good|best|awesome|terrible|worst|bad)\s*(barber|shop|place|service)/i.test(reviewText);
  const isFake = isTooShort || isGeneric;
  
  // Attack indicators (all caps, excessive exclamation)
  const isAllCaps = reviewText === reviewText.toUpperCase() && reviewText.length > 20;
  const excessiveExclamation = (reviewText.match(/!/g) || []).length > 5;
  const isAttack = isAllCaps || excessiveExclamation;
  
  // Inappropriate indicators
  const profanityList = ['fuck', 'shit', 'bitch', 'asshole', 'bastard']; // Basic list, expand as needed
  const hasProfanity = profanityList.some(word => lower.includes(word));
  const isInappropriate = hasProfanity && !/great|good|amazing/.test(lower); // Context matters
  
  return {
    is_spam: hasSpam,
    is_fake: isFake,
    is_attack: isAttack,
    is_inappropriate: isInappropriate,
    confidence: 0.6, // Lower confidence for heuristics
    reason: 'Heuristic fallback (LLM unavailable)'
  };
}

/**
 * Detect coordinated attack patterns for a barber/shop
 * 
 * Looks for:
 * - Burst patterns (many reviews in short time)
 * - Similar review text (copy-paste variations)
 * - New user accounts (created just to review)
 * - Sentiment anomalies (all 1-star or all 5-star)
 * 
 * @param {number} barberIdOrShopId - Barber or shop to check
 * @param {string} entityType - 'barber' or 'shop'
 * @param {number} timeWindow - Seconds to look back (default: 24 hours)
 * @returns {Object} Attack detection result
 */
async function detectCoordinatedAttack(barberIdOrShopId, entityType = 'barber', timeWindow = 86400) {
  const whereClause = entityType === 'barber' 
    ? 'barber_id = $1' 
    : 'shop_id = $1';

  try {
    // Fetch recent reviews
    const query = `
      SELECT 
        r.id,
        r.review_text,
        r.rating,
        r.created_at,
        r.user_id,
        u.created_at as user_created_at
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE ${whereClause}
        AND r.created_at > NOW() - INTERVAL '${timeWindow} seconds'
      ORDER BY r.created_at DESC
    `;

    const result = await db.query(query, [barberIdOrShopId]);
    const reviews = result.rows;

    if (reviews.length < 3) {
      return {
        is_attack: false,
        confidence: 0.9,
        reason: 'Too few reviews to detect coordinated pattern'
      };
    }

    // Check 1: Burst pattern (>5 reviews in 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600 * 1000);
    const recentBurst = reviews.filter(r => new Date(r.created_at) > oneHourAgo);
    const hasBurst = recentBurst.length > 5;

    // Check 2: Similar text (Levenshtein distance or simple substring matching)
    const textSimilarity = calculateTextSimilarity(reviews.map(r => r.review_text));
    const hasDuplicates = textSimilarity > 0.7; // 70% similar

    // Check 3: New user accounts (created <7 days ago)
    const newUsers = reviews.filter(r => {
      if (!r.user_created_at) return false;
      const accountAge = (Date.now() - new Date(r.user_created_at).getTime()) / 1000 / 86400;
      return accountAge < 7;
    });
    const hasNewUserCluster = newUsers.length >= reviews.length * 0.6; // 60% new accounts

    // Check 4: Sentiment anomaly (all 1-star or all 5-star)
    const ratings = reviews.map(r => r.rating);
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length;
    const hasSentimentAnomaly = variance < 0.5 && (avgRating <= 1.5 || avgRating >= 4.5);

    // Scoring
    const indicators = [
      { name: 'burst_pattern', detected: hasBurst, weight: 0.3 },
      { name: 'duplicate_text', detected: hasDuplicates, weight: 0.3 },
      { name: 'new_user_cluster', detected: hasNewUserCluster, weight: 0.2 },
      { name: 'sentiment_anomaly', detected: hasSentimentAnomaly, weight: 0.2 }
    ];

    const attackScore = indicators
      .filter(i => i.detected)
      .reduce((sum, i) => sum + i.weight, 0);

    const isAttack = attackScore >= 0.5; // 50% threshold

    const detectedIndicators = indicators
      .filter(i => i.detected)
      .map(i => i.name)
      .join(', ');

    return {
      is_attack: isAttack,
      confidence: Math.min(attackScore * 1.5, 1.0), // Scale up confidence
      reason: isAttack 
        ? `Detected: ${detectedIndicators} (${reviews.length} reviews in ${timeWindow / 3600}h)`
        : 'No coordinated attack pattern detected',
      indicators: indicators.map(i => ({ name: i.name, detected: i.detected }))
    };

  } catch (error) {
    logger.error('Coordinated attack detection failed', { 
      error: error.message,
      entity_id: barberIdOrShopId,
      entity_type: entityType
    });

    return {
      is_attack: false,
      confidence: 0.0,
      reason: `Detection error: ${error.message}`
    };
  }
}

/**
 * Calculate text similarity across reviews (simple substring matching)
 * Returns 0-1 score (1 = all reviews identical)
 */
function calculateTextSimilarity(texts) {
  if (texts.length < 2) return 0;

  // Normalize texts (lowercase, remove punctuation, trim)
  const normalized = texts.map(t => 
    t.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim()
  );

  // Count pairs with >50% overlap
  let similarPairs = 0;
  let totalPairs = 0;

  for (let i = 0; i < normalized.length; i++) {
    for (let j = i + 1; j < normalized.length; j++) {
      totalPairs++;
      
      const text1 = normalized[i];
      const text2 = normalized[j];
      
      // Simple substring overlap check
      const shorter = text1.length < text2.length ? text1 : text2;
      const longer = text1.length >= text2.length ? text1 : text2;
      
      if (longer.includes(shorter) || calculateOverlapRatio(text1, text2) > 0.5) {
        similarPairs++;
      }
    }
  }

  return totalPairs > 0 ? similarPairs / totalPairs : 0;
}

/**
 * Calculate word overlap ratio between two texts
 */
function calculateOverlapRatio(text1, text2) {
  const words1 = new Set(text1.split(/\s+/));
  const words2 = new Set(text2.split(/\s+/));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Batch moderate multiple reviews
 * 
 * @param {Array} reviews - Array of review objects with { id, review_text, barber_id, ... }
 * @returns {Array} Moderation results with review IDs
 */
async function moderateReviews(reviews) {
  const results = [];

  for (const review of reviews) {
    const metadata = {
      barber_id: review.barber_id,
      shop_id: review.shop_id,
      barber_name: review.barber_name,
      shop_name: review.shop_name,
      review_date: review.created_at
    };

    const moderation = await moderateReview(review.review_text, metadata);
    
    results.push({
      review_id: review.id,
      ...moderation
    });

    // Rate limit: 1 request per 0.5s (120 req/min for OpenAI)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return results;
}

/**
 * Store moderation result in database
 * 
 * @param {number} reviewId - Review ID
 * @param {Object} moderationResult - Result from moderateReview()
 */
async function storeModerationResult(reviewId, moderationResult) {
  const status = (moderationResult.is_spam || moderationResult.is_fake || moderationResult.is_attack || moderationResult.is_inappropriate)
    ? 'flagged'
    : 'clean';

  const reason = moderationResult.reason || 'Auto-moderated';

  try {
    await db.query(`
      UPDATE reviews
      SET 
        moderation_status = $1,
        moderation_reason = $2,
        moderated_at = NOW(),
        moderated_by = 'llm',
        prefilter_flags = prefilter_flags || $3::jsonb,
        prefilter_details = prefilter_details || $4::jsonb
      WHERE id = $5
    `, [
      status,
      reason,
      JSON.stringify({
        spam: moderationResult.is_spam,
        fake: moderationResult.is_fake,
        attack: moderationResult.is_attack,
        inappropriate: moderationResult.is_inappropriate
      }),
      JSON.stringify({
        confidence: moderationResult.confidence,
        reason: moderationResult.reason,
        moderated_at: new Date().toISOString()
      }),
      reviewId
    ]);

    logger.info('Moderation result stored', {
      review_id: reviewId,
      status,
      confidence: moderationResult.confidence
    });

  } catch (error) {
    logger.error('Failed to store moderation result', {
      review_id: reviewId,
      error: error.message
    });
  }
}

module.exports = {
  moderateReview,
  detectCoordinatedAttack,
  moderateReviews,
  storeModerationResult
};
