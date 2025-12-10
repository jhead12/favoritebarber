# Comment Quality Guidelines for LLM Analysis

Purpose
- Provide a clear, actionable rubric for evaluating user comments/reviews before or after LLM-based processing.
- Enable consistent labeling of comments as `helpful`, `neutral`, `unhelpful`, `spam`, `abusive`, `off-topic`, or `exposes_pii`.
- Define scoring rules, thresholds for automated actions, and exemplar cases for training and QA.

Scope
- Applies to review text, comments, image captions, and free-form user input that will be analyzed, summarized, or acted on by LLMs in this project.

Design principles
- Safety first: flag abusive or PII-leaking content for human review and don't surface it directly.
- Usefulness: prioritize content that helps other users (actionable, descriptive, specific).
- Explainability: labels and scores must map to simple rules that product owners can understand and tune.

Label taxonomy (primary tags)
- helpful: Adds useful, specific information about a service or barber (actions taken, concrete details, results).
- neutral: Non-actionable or purely factual statements ("I visited yesterday.").
- unhelpful: Vague, one-word, or generic praise/criticism without useful details ("Good", "Bad").
- spam: Promotional, advertisement, repeated content, or links with no contextual relevance.
- abusive: Harassment, hate speech, threats, slurs, sexual content directed at people.
- off-topic: Not about the barber/shop/service (political rant, unrelated personal story).
- exposes_pii: Contains personally identifying information (phone numbers, emails, full names, addresses) or encourages doxxing.

Secondary tags (optional)
- sentiment_positive / sentiment_negative / sentiment_mixed
- mentions_style: references a hairstyle or technique (e.g., "fade", "pompadour")
- mentions_price: references cost or value
- mentions_wait_time: references wait or appointment times
- mentions_location: references address/area

Scoring rubric (numeric, 0-5)
- 5 (Excellent / Highly helpful): Actionable detail, identifies barber/service, outcome, context. Example: "Tony at Main St gave me a perfect low fade; appointment was on time and edges were crisp — asked for a 2 on the clipper, took 30 min."
- 4 (Good): Useful specifics but missing one of the above (e.g., no duration or price).
- 3 (Moderate): Some useful detail but limited (mentions style but no actionable context).
- 2 (Poor): Mostly vague, short phrases or generic statements.
- 1 (Bad): One word, emoji-only, or clearly irrelevant content.
- 0 (Harmful / Blocked): Abusive content, spam, or PII — should be removed or flagged immediately.

Automated actions & thresholds (recommended default)
- score >= 4: Treat as high-quality. Eligible to be surfaced in highlights and used for stylist/shop profiles.
- 3 <= score < 4: Useful but may require light sanitization (remove small PII fragments) before surfacing.
- 1 <= score < 3: Don't highlight; keep in DB for audit but deprioritize in UI.
- score == 0 OR tag abusive/spam/exposes_pii: Hide from public views and queue for human moderator review.

Preprocessing steps before LLM or rule-based classification
1. Normalize whitespace and punctuation.
2. Lowercase for keyword matching (but preserve raw text for context and display).
3. Remove or mask obvious email addresses, phone numbers, and credit card-like strings before running public LLMs (store raw text in internal DB if retention policy allows).
4. Expand common abbreviations (e.g., "appt" -> "appointment") only for internal analysis.
5. Remove repeated characters or emoji-only comments; mark them as low-signal.

LLM prompt templates (recommended)
- Classification prompt (concise):

  ```
  You are a content-quality classifier. Given the following user comment, return a JSON object with keys: "score" (0-5 integer), "tags" (array of labels), and "reason" (short human-readable justification). Do not include any other text.
  Comment: "<USER_COMMENT>"
  ```

- Safety-first classifier (focused on abusive/PII detection):

  ```
  You are a safety classifier. Return only a JSON with keys: "safety" ("ok"|"flag"), "flags" (array of reasons: abusive, sexual, pii, spam), and "confidence" (0-1). Comment: "<USER_COMMENT>"
  ```

- Extractive enrichment (when comment is helpful):

  ```
  Extract up to three structured facts from this review: (1) hairstyle or service requested, (2) quality/outcome, (3) appointment/wait details or price if present. Return JSON with fields "service", "outcome", "details". If not present, return nulls.
  Review: "<USER_COMMENT>"
  ```

Recommended parsing & output format
- Primary output: { score: int, tags: [..], reason: string }
- Safety output (if flagged): { safety: 'flag', flags: [...], human_review: true }
- Enrichment output (if score >= 3): { service, outcome, details }

Examples (labeled)
- Example 1 — Helpful (score 5, tags: [helpful, mentions_style])
  - Text: "I asked for a low fade with a 2 on the sides and 4 on top. Maria at Corner Cuts did it in 35 minutes and the line-up was perfect. Definitely going back." 
  - Rationale: Specific instructions, barber named, timing, outcome.

- Example 2 — Neutral (score 3, tags: [mentions_style])
  - Text: "Got a fade yesterday, looks fine." 
  - Rationale: Mentions style but lacks detail.

- Example 3 — Unhelpful (score 1, tags: [unhelpful])
  - Text: "Great!" 
  - Rationale: No useful information.

- Example 4 — Spam (score 0, tags: [spam])
  - Text: "Visit BestCutsNow.com for 50% off haircuts!" 
  - Rationale: Promotional link; not a review.

- Example 5 — Abusive (score 0, tags: [abusive])
  - Text: "That barber is an idiot and ruined my hair." 
  - Rationale: Contains targeted insult; should be flagged for moderation.

- Example 6 — Exposes PII (score 0, tags: [exposes_pii])
  - Text: "Call me at 555-123-4567 to book a slot." 
  - Rationale: Contains phone number — mask before passing to public LLMs and queue for review.

Edge cases & guidance
- Mixed content: If a comment contains both helpful info and a small PII fragment, extract the helpful bits, mask the PII, and set a secondary flag `exposes_pii` for audit.
- Sarcasm & irony: These are hard to detect; lower confidence and queue borderline results for human review if they impact outcomes.
- Non-English comments: Mark with `language:x` or `non_english` and either route to appropriate language model or queue for human moderation if untranslated.

Implementation notes for devs
- Keep the classifier fast and inexpensive: apply simple rule-based checks first (regex for PII, blacklist for spam), then call LLM only for ambiguous/high-value content.
- Log all model inputs and outputs (prompt + response) to `api/ai/logs/` with anonymized IDs for debugging.
- Version the prompts and schema in `api/ai/prompts/` and add entries to `api/ai/logs/` when you change them.

Presidio integration (optional)
- We support optional PII detection via Microsoft Presidio. To enable, run a Presidio analyzer service and set `PRESIDIO_URL` in your environment to its base URL (e.g., `http://localhost:3000`). The enrichment pipeline will call `POST ${PRESIDIO_URL}/analyze` and use returned spans to mask PII.
- If `PRESIDIO_URL` is not set or the call fails, the system falls back to the built-in regex-based pre-filter.

Data retention & privacy notes
- Prefiltered (masked) text is safe to send to public LLMs. Raw text may contain PII and should only be stored in internal DB if your retention and access controls comply with privacy policy. The pipeline stores prefilter flags and details in `reviews.prefilter_flags` and `reviews.prefilter_details` for auditing.

Monitoring & metrics
- Track the distribution of scores over time.
- Track the rate of flagged items (abusive/spam/pii) and human review turnaround.
- Manually sample borderline classifications weekly for quality assurance.

Post date & aging-based scoring
- We persist the original post timestamp from the source in `reviews.created_at` when available. If a source does not provide a date, the ingestion pipeline will set `created_at` to the ingestion time.
- Use `created_at` to compute age-based decay or scaling factors for review weight. Example approaches:
  - Simple linear decay: weight = max(0, 1 - (age_days / 365))
  - Exponential decay: weight = exp(-lambda * age_days) where lambda controls half-life
  - Bucketed scoring: more weight for reviews in last 30/90/365 days
- Store computed aggregated scores on the barber/shop profile (e.g., `barbers.languages` or `barbers.score_age_weighted`) or compute at query-time depending on freshness needs.

Example SQL to compute age in days and a simple linear weight:
```sql
SELECT id, text, created_at,
  EXTRACT(epoch FROM (now() - created_at))/86400.0 AS age_days,
  GREATEST(0, 1 - (EXTRACT(epoch FROM (now() - created_at))/86400.0)/365.0) AS linear_weight
FROM reviews
WHERE barber_id = $1;
```

Next steps (recommended)
- Add this file to the repo at `docs/COMMENT_QUALITY_GUIDELINES.md` (done).
- Create `workers/llm/test_comment_quality.js` with a set of unit tests derived from the examples above (I can implement if you want).
- Add a lightweight rule-based pre-filter in `workers/llm/review_parser.js` to mask PII and quick-flag spam/abuse before LLM calls.

FAQ
- Q: Should we send raw comments to external LLMs?
  - A: Avoid sending unmasked PII to public LLMs. Mask personal data and log raw text internally only if policy allows.

- Q: How strict should the spam filter be?
  - A: Start conservative (favor false negatives) and tighten as signal improves to avoid censoring real reviews.

---

Document version: 1.0
Created: 2025-12-09
Author: RateYourBarber engineering
