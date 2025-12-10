# Trust Score — RateYourBarber

This document describes how we compute a Trust Score for barber/shop profiles. The Trust Score is a composite, explainable number intended to help users identify reliable, high-quality barbers and reduce the impact of spam, fake reviews, and stale data.

Summary
- Purpose: create a single, interpretable score in range [0..100] representing profile trustworthiness and quality.
- Where computed: workers/enrichment pipeline (periodic or event-driven). Stored in `barbers.trust_score` (numeric) and `barbers.trust_components` (JSON) for transparency.

Design principles
- Explainable: break the score into named components and persist the components.
- Robust to sparsity: use priors / smoothing when there are few reviews.
- Time-aware: recency should matter (decay older evidence slowly).
- Safe & fair: do not infer protected attributes from images or text; only use non-sensitive signals.

Inputs (recommended)
- Average rating (normalized 1..5) — from Yelp or other sources.
- Review-derived signals:
  - Positive/negative ratio or sentiment score (from review text analysis).
  - Named-entity evidence (explicit mentions of barbers by name) indicating recommendation.
  - Review volume (count).
- Review recency distribution (more recent reviews weight more).
- Image signals:
  - Is image authentic? (Yelp-hosted vs scraped; probability from image-analysis model)
  - Image quality / diversity (presence of multiple photos across times)
- Profile metadata:
  - Verified/claimed profile status (e.g., owner-verified) — strong positive signal.
  - Business attributes (hours, multiple locations, URL presence).
  - Response activity (owner responses to reviews).
- Abuse signals (negative):
  - Sudden spike in reviews (possible manipulation)
  - Very low review ages clustered together (suspicious)
  - Reports / flags

Component weights (example)
We combine normalized components into a 0..100 score. Example weighting (tunable):

- Rating (normalized 0..1): 30%
- Review sentiment & named-entity recommendations: 25%
- Review volume & consistency (log-scaled): 10%
- Recency (time-decay weighted score): 10%
- Verification / claimed status: 15%
- Image authenticity & quality: 6%
- Abuse penalties (deductions): up to -20% (applied after base score)

Normalization and smoothing
- Ratings: map 1..5 to 0..1 by (rating - 1) / 4.
- Review sentiment: map model output (e.g., [-1..1]) to 0..1 by (sent+1)/2.
- Volume: use log(1 + count) and then min-max or logistic to 0..1 range.
- Bayesian smoothing for low-count ratings: combine observed average with a global prior mean (mu_0) and weight by k = prior_strength.

Example: Bayesian-smoothed rating

smoothed_rating = (k * mu_0 + n * r_obs) / (k + n)

where:
- mu_0 = global mean rating (e.g., 4.2)
- k = prior strength (e.g., 5)
- n = number of rating observations
- r_obs = observed mean rating

Time decay for recency
- Compute weighted sentiment or rating using exponential decay:

weight(t) = exp(-lambda * age_days)

Choose lambda so half-life is sensible (e.g., half-life = 180 days → lambda = ln(2)/180).

Combining components (pseudocode)

base = w_rating * norm_rating
     + w_sentiment * norm_sentiment
     + w_volume * norm_volume
     + w_recency * norm_recency
     + w_verification * (is_verified ? 1 : 0)
     + w_image * norm_image

penalty = detect_abuse_penalty(profile)
score = clamp((base - penalty) * 100, 0, 100)

Persisted schema suggestions
- `barbers.trust_score` (numeric, 0..100)
- `barbers.trust_components` (jsonb): store each normalized component and raw inputs, e.g.:

{
  "rating": 0.82,
  "smoothed_rating": 0.79,
  "sentiment": 0.65,
  "volume": 0.30,
  "recency": 0.88,
  "verification": 1,
  "image_authenticity": 0.9,
  "penalty": 0.0
}

SQL / Worker implementation notes
- Implement a worker `workers/enrichment/trust_score.js` (or Python) that:
  1. Queries barbers needing updates (last updated > X hours or new evidence arrived).
  2. Aggregates required inputs from `reviews`, `images`, `locations`, `sources`.
  3. Computes normalized components and the final score.
  4. Writes `trust_components` JSON and `trust_score` to the `barbers` table, with `trust_updated_at = now()`.

Simple SQL update example (approximation)

-- compute a simple score combining smoothed_rating and recency
WITH agg AS (
  SELECT b.id, r.avg_rating, r.count, 
    (5.0 - 1.0) as scale -- placeholder
  FROM barbers b
  LEFT JOIN (
    SELECT barber_id, avg(rating) AS avg_rating, count(*) AS count
    FROM reviews
    GROUP BY barber_id
  ) r ON r.barber_id = b.id
)
UPDATE barbers
SET trust_score = LEAST(100, GREATEST(0, (( ( ( (COALESCE(agg.avg_rating,3.5)-1)/4 ) * 0.6) + 0.4* (LEAST(1, LOG(1+COALESCE(agg.count,0))/LOG(100))) ) * 100)))
FROM agg
WHERE barbers.id = agg.id;

Notes: the above is a simplified example — prefer doing math in code for clarity and unit tests.

Abuse-detection & safety rules
- Minimum-data threshold: if review_count < N_min (e.g., 3), show score but mark as low-confidence.
- Spam detection: flag profiles with review bursts, duplicate content, or many identical photos.
- Penalty capping: cap penalties to avoid driving legitimate profiles to 0 unfairly.
- Logs & human review: store audit logs for large score changes for manual review.

Transparency in UI
- Show the overall score and an expandable breakdown of components with brief descriptions and last-updated timestamp.
- If low-confidence, show a tooltip: "Low confidence — limited reviews".

Testing and evaluation
- Offline tests: prepare synthetic datasets with known outcomes (good, average, spammy) and verify score ordering.
- Metrics: measure correlation between trust_score and user actions (click-throughs, bookings, disputes). Track distribution over time.
- A/B test different weightings and priors in production with a holdout set before wide rollout.

Privacy & compliance
- Do not use inferred sensitive attributes (ethnicity, religion, sexual orientation, etc.) in scoring.
- Minimize retention of PII in intermediate logs; anonymize where possible.

Operational considerations
- Recompute cadence: hourly for recently-updated profiles, daily for the rest.
- Idempotency: worker should be idempotent; compute from raw inputs and overwrite columns.
- Monitoring: emit metrics (histogram of trust_score, number recomputed per hour, mean component values) to detect regressions.

Next steps / Implementation checklist
- [ ] Implement `workers/enrichment/trust_score.js` and unit tests for component normalization.
- [ ] Add `trust_score` and `trust_components` columns via migration if not present.
- [ ] Build an admin UI to view audit logs and to manually override a score or flag profiles.
- [ ] Connect image analysis outputs and name-mention NER results to the sentiment/named-entity component.
- [ ] Run offline evaluation on an extracted sample of Yelp-sourced reviews.

Contact
If you want I can implement the worker and add the DB migration next — tell me whether you prefer the worker in Node or Python and which weights/prior you want as defaults.
