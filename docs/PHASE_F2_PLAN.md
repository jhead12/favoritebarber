# Phase F.2 - Trust & Verification Implementation Plan

**Goal**: Build spam detection, trust scoring, and verification badge system to prevent abuse and build user confidence.

## Status: Ready to Implement

### What Already Exists ✅

1. **Database Schema**
   - `barbers.trust_score` (NUMERIC 0-100)
   - `barbers.trust_components` (JSONB for explainability)
   - `reviews.prefilter_flags` (JSONB spam detection)
   - `reviews.prefilter_details` (JSONB spam evidence)

2. **Spam Detection (Basic)**
   - PII masking (emails, phones, SSNs, credit cards)
   - Heuristic spam detection in `workers/llm/review_parser.js`:
     - Promotional keywords (buy now, click here, promo code)
     - External links
     - Call-to-action phrases
     - Emoji/symbol-only reviews
     - Excessive punctuation
     - ALL CAPS abuse

3. **Documentation**
   - `docs/TRUST_SCORE.md` - Complete trust scoring algorithm design

### What Needs Building 🔨

## Task 1: LLM-Powered Spam Detection ⭐ Priority 1

### Create Review Moderator
**File**: `workers/llm/moderator.js`

**Capabilities**:
1. **Spam Detection**
   - Detect fake/bot-generated reviews
   - Identify review farming patterns
   - Flag competitor sabotage attempts
   
2. **Coordinated Attack Detection**
   - Multiple reviews from same IP/device
   - Identical review text across profiles
   - Burst patterns (10+ reviews in 1 hour)

3. **Content Moderation**
   - Hate speech/harassment
   - Threats or doxxing
   - Off-topic content (not about barbering)

**Implementation**:
```javascript
// workers/llm/moderator.js
const { llm_client } = require('./llm_client');

async function moderateReview(reviewText, metadata = {}) {
  const prompt = `Analyze this barber review for spam/abuse.
Review: "${reviewText}"

Detect:
1. Fake/bot review (generic, template-like)
2. Spam (promo codes, external links, solicitation)
3. Coordinated attack (suspiciously negative/positive)
4. Inappropriate content (harassment, threats)

Return JSON: { "is_spam": bool, "is_fake": bool, "is_attack": bool, "is_inappropriate": bool, "confidence": 0-1, "reason": "explanation" }`;

  const response = await llm_client.call(prompt, { 
    model: 'gpt-4o-mini', 
    temperature: 0.1,
    max_tokens: 150
  });
  
  return parseModeration Result(response);
}

async function detectCoordinatedAttack(barberIdOrShopId, timeWindow = 86400) {
  // Query reviews in time window
  // Check for:
  // - Same text variations
  // - Burst patterns
  // - User account patterns (new accounts, single review each)
  // - Sentiment anomalies (all 5-star or all 1-star)
}

module.exports = { moderateReview, detectCoordinatedAttack };
```

---

## Task 2: Trust Score Worker ⭐ Priority 1

### Implement Trust Score Computation
**File**: `workers/jobs/trustScorer.js`

**Inputs**:
- Review ratings & sentiment (from `reviews`)
- Review volume & recency
- Verification status (claimed profile, owner-verified)
- Image authenticity scores (from `image_analysis`)
- Spam/abuse penalties (from moderation)

**Components** (see `docs/TRUST_SCORE.md`):
1. **Rating Score** (30%) - Bayesian-smoothed average
2. **Sentiment Score** (25%) - LLM-analyzed sentiment
3. **Volume Score** (10%) - Log-scaled review count
4. **Recency Score** (10%) - Time-weighted reviews
5. **Verification Bonus** (15%) - Claimed/verified profiles
6. **Image Quality** (6%) - Photo authenticity
7. **Abuse Penalty** (up to -20%) - Spam flags

**Implementation**:
```javascript
// workers/jobs/trustScorer.js
const { Pool } = require('pg');

async function computeTrustScore(barberId) {
  // 1. Fetch aggregated data
  const reviews = await getBarberReviews(barberId);
  const verification = await getVerificationStatus(barberId);
  const images = await getImageAnalysis(barberId);
  const spamFlags = await getSpamFlags(barberId);
  
  // 2. Compute normalized components
  const ratingScore = computeBayesianRating(reviews);
  const sentimentScore = computeSentimentScore(reviews);
  const volumeScore = computeVolumeScore(reviews.length);
  const recencyScore = computeRecencyScore(reviews);
  const verificationBonus = verification.claimed ? 15 : 0;
  const imageScore = computeImageScore(images);
  const abusePenalty = computeAbusePenalty(spamFlags);
  
  // 3. Weighted combination
  const baseScore = 
    ratingScore * 0.30 +
    sentimentScore * 0.25 +
    volumeScore * 0.10 +
    recencyScore * 0.10 +
    (verificationBonus / 100) * 0.15 +
    imageScore * 0.06;
  
  const finalScore = Math.max(0, Math.min(100, (baseScore - abusePenalty) * 100));
  
  // 4. Store components for transparency
  const components = {
    rating: ratingScore,
    sentiment: sentimentScore,
    volume: volumeScore,
    recency: recencyScore,
    verification: verificationBonus,
    image: imageScore,
    penalty: abusePenalty,
    computed_at: new Date().toISOString()
  };
  
  return { score: finalScore, components };
}

async function recomputeAll Scores(limit = 100) {
  // Batch update trust scores
  const barbers = await db.query(`
    SELECT id FROM barbers 
    WHERE trust_updated_at IS NULL 
       OR trust_updated_at < NOW() - INTERVAL '24 hours'
    ORDER BY trust_updated_at ASC NULLS FIRST
    LIMIT $1
  `, [limit]);
  
  for (const barber of barbers.rows) {
    const { score, components } = await computeTrustScore(barber.id);
    await updateTrustScore(barber.id, score, components);
  }
}
```

---

## Task 3: Verification Signals Migration ⭐ Priority 2

### Add Verification Columns
**File**: `api/migrations/029_add_verification_signals.sql`

```sql
-- Migration 029: Add verification signals for trust scoring

-- Add verification tracking to barbers
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS verified_by TEXT; -- 'owner', 'admin', 'photo', 'license'
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS verification_evidence JSONB; -- photo URLs, license numbers, etc.
ALTER TABLE barbers ADD COLUMN IF NOT EXISTS trust_updated_at TIMESTAMPTZ;

-- Add spam/moderation tracking to reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_status TEXT; -- 'clean', 'flagged', 'removed'
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderation_reason TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS moderated_by TEXT; -- 'llm', 'admin', 'user_report'

-- Add user reporting
CREATE TABLE IF NOT EXISTS review_reports (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  report_type TEXT NOT NULL, -- 'spam', 'fake', 'harassment', 'inappropriate', 'off_topic'
  report_details TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned', 'dismissed'
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add verification requests
CREATE TABLE IF NOT EXISTS verification_requests (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER REFERENCES barbers(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  verification_type TEXT NOT NULL, -- 'photo_location', 'business_license', 'receipt', 'owner_claim'
  evidence_urls TEXT[], -- photo uploads, document scans
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_barbers_verified ON barbers(verified) WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_barbers_trust_updated ON barbers(trust_updated_at DESC NULLS FIRST);
CREATE INDEX IF NOT EXISTS idx_reviews_moderation ON reviews(moderation_status) WHERE moderation_status != 'clean';
CREATE INDEX IF NOT EXISTS idx_review_reports_status ON review_reports(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status) WHERE status = 'pending';

-- Comments
COMMENT ON COLUMN barbers.verified IS 'TRUE if barber profile has been verified';
COMMENT ON COLUMN barbers.verification_evidence IS 'JSON evidence for verification (photo URLs, license info)';
COMMENT ON TABLE review_reports IS 'User-reported spam/abuse reviews';
COMMENT ON TABLE verification_requests IS 'Barber verification requests (owner claims, license uploads)';
```

---

## Task 4: Report Spam API Endpoint ⭐ Priority 2

### Add User Reporting
**File**: `api/routes/reviews.js` (add route)

```javascript
// POST /api/reviews/:id/report
router.post('/:id/report', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { report_type, details } = req.body;
  const userId = req.user.id;
  
  const validTypes = ['spam', 'fake', 'harassment', 'inappropriate', 'off_topic'];
  if (!validTypes.includes(report_type)) {
    return res.status(400).json({ error: 'invalid_report_type' });
  }
  
  // Check if review exists
  const review = await db.query('SELECT id FROM reviews WHERE id = $1', [id]);
  if (review.rows.length === 0) {
    return res.status(404).json({ error: 'review_not_found' });
  }
  
  // Insert report
  await db.query(`
    INSERT INTO review_reports (review_id, reported_by, report_type, report_details)
    VALUES ($1, $2, $3, $4)
  `, [id, userId, report_type, details || null]);
  
  // If multiple reports (>3), auto-flag review
  const reportCount = await db.query(`
    SELECT COUNT(*) FROM review_reports WHERE review_id = $1 AND status = 'pending'
  `, [id]);
  
  if (parseInt(reportCount.rows[0].count) >= 3) {
    await db.query(`
      UPDATE reviews SET moderation_status = 'flagged', moderation_reason = 'multiple_reports'
      WHERE id = $1
    `, [id]);
  }
  
  res.json({ success: true });
});
```

---

## Task 5: Verified Badge UI Component ⭐ Priority 3

### Add Badge to Profile Display
**File**: `web/components/VerifiedBadge.tsx`

```typescript
interface VerifiedBadgeProps {
  verified: boolean;
  verificationType?: string;
  verifiedAt?: string;
}

export function VerifiedBadge({ verified, verificationType, verifiedAt }: VerifiedBadgeProps) {
  if (!verified) return null;
  
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full text-sm">
      <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="font-medium text-blue-900">Verified</span>
      {verificationType && (
        <span className="text-blue-700 text-xs ml-1">({verificationType})</span>
      )}
    </div>
  );
}
```

---

## Task 6: Admin Moderation Dashboard ⭐ Priority 3

### Create Admin UI
**File**: `web/pages/admin/moderation.tsx`

**Features**:
- Pending review reports queue
- Spam-flagged reviews table
- Verification requests approval
- Bulk actions (approve/reject)
- Trust score overrides

---

## Task 7: Automated Trust Score Cron ⭐ Priority 4

### Schedule Periodic Recomputation
**File**: `workers/jobs/trustScoreScheduler.js`

```javascript
const cron = require('node-cron');
const { recomputeAllScores } = require('./trustScorer');

// Run every hour
cron.schedule('0 * * * *', async () => {
  console.log('Starting trust score recomputation...');
  try {
    await recomputeAllScores(100); // Process 100 profiles per hour
    console.log('Trust score recomputation complete');
  } catch (err) {
    console.error('Trust score recomputation failed:', err);
  }
});
```

---

## Success Metrics

**Phase F.2 Complete When**:
- ✅ LLM moderator detects spam/fake reviews
- ✅ Trust scores computed and displayed on profiles
- ✅ Verified badge shown for verified barbers
- ✅ Users can report spam with "Report" button
- ✅ Admin dashboard shows moderation queue
- ✅ Automated trust score updates (hourly cron)

---

## Implementation Timeline

### Week 1: Core Infrastructure
- Day 1-2: Create migration 029 (verification columns)
- Day 3-4: Implement LLM moderator (moderator.js)
- Day 5: Add report spam API endpoint

### Week 2: Trust Scoring
- Day 6-7: Implement trust score worker (trustScorer.js)
- Day 8-9: Test trust score computation
- Day 10: Schedule cron job

### Week 3: UI & Admin
- Day 11-12: Add verified badge component
- Day 13-14: Build admin moderation dashboard
- Day 15: End-to-end testing

---

## Testing Plan

### Unit Tests
```bash
# Test moderator
node workers/llm/test_moderator.js

# Test trust scorer
node workers/jobs/test_trustScorer.js
```

### Integration Tests
```javascript
// tests/integration/test_moderation_flow.js
describe('Moderation Flow', () => {
  test('should flag spam review', async () => {
    const review = { text: 'Buy now! Visit myshop.com for discount!' };
    const result = await moderateReview(review.text);
    expect(result.is_spam).toBe(true);
  });
  
  test('should compute trust score', async () => {
    const score = await computeTrustScore(testBarberId);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
  });
});
```

---

## Related Documentation

- [TRUST_SCORE.md](TRUST_SCORE.md) - Trust scoring algorithm design
- [ENRICHMENT_MULTI_PROVIDER.md](ENRICHMENT_MULTI_PROVIDER.md) - LLM provider setup
- [USER_SYSTEM.md](USER_SYSTEM.md) - Authentication for reporting

---

## Next Steps

After Phase F.2, proceed to:
- **Phase F.1**: Barber claim & curate workflow
- **Phase F.3**: Social feed thumbnails & visual polish
- **Phase D**: MCP rollout with partner telemetry

---

## Quick Start Commands

```bash
# Apply migration
npm run migrate

# Test moderator
LLM_PROVIDER=openai node workers/llm/test_moderator.js

# Compute trust scores
node workers/jobs/trustScorer.js --all

# Start cron scheduler
node workers/jobs/trustScoreScheduler.js
```
