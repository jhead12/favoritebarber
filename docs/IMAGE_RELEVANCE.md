# Image Relevance & Authenticity — RateYourBarber

Goal
- Ensure images associated with barber/shop profiles are actually related to the barber or shop (not generic stock, unrelated scenes, or malicious content). Use automated checks to assign an `image_relevance` and `image_authenticity` score and persist analysis results in `image_analyses`.

Principles
- Prefer provenance over inference: Yelp-hosted images and images from trusted sources get higher baseline trust.
- Use multimodal signals: visual object detection (barber tools, chair, haircut closeups), face detection (if present), textual overlays (logos, shop names), and context (photo timestamps / uploader metadata).
- Penalize obviously unrelated images: landscapes, memes, ads, or images with no barber/shop visual evidence.
- Be conservative with sensitive inferences: never infer protected attributes; only detect objects and scene context.

Automated checks (ordered)
1. Source provenance
   - If `image.source = 'yelp'` or domain contains `yelp.com`, give a positive provenance score (e.g., +0.25).
   - If uploader is verified (owner claim), add further bump.

2. Image content analysis (vision model)
   - Object detection: look for `barber chair`, `scissors`, `clippers`, `haircut`, `mirror`, `barber pole`.
   - Face detection: presence of faces near haircut regions is evidence (but respect privacy and PII rules).
   - Text/logo detection: OCR detection of shop name or address in image is positive evidence.
   - Image style: close-up of haircut vs. full-shop photo (both useful but different weights).

3. Cross-signal checks
   - Compare image timestamp with review timestamps (if uploader tied to a review) and geographic metadata (if available).
   - Check captions/review text for references to the image ("see my cut by Tony") using simple NER/mention matching.

4. Duplicate and stock detection
   - Check image hash (perceptual hash) against other images; very common images across many profiles are likely stock or spam.
   - Optionally run reverse-image check against known stock image sets (expensive; run for edge cases).

5. Score composition (example)
   - provenance_score: 0..0.3
   - object_score: 0..0.4
   - face_score: 0..0.15
   - ocr_score: 0..0.1
   - uniqueness_score: 0..0.05
   - total = sum -> clamp(0..1)

Where `image_relevance = total` and `image_authenticity = total * provenance_boost` (or similar).

Integration & storage
- Add/ensure migration for `image_analyses` table (jsonb) with columns: `image_id`, `analyzed_at`, `analysis` (jsonb), `relevance_score`, `authenticity_score`, `model_version`, `notes`.
- Workers: `workers/image_processor.js` picks up new images (from queue or DB), runs vision + heuristics, writes analysis and updates `images.relevance_score` and `images.authenticity_score`.

Operational notes
- Use an async pipeline: fetch images -> run vision calls (batched) -> compute heuristics -> persist.
- Caching: store model outputs and p-hashes to avoid repeated calls.
- Cost control: only send candidate images to expensive reverse-image checks when necessary (low score or high-impact profiles).

Privacy & Safety
- Do not store or use face recognition identities. Use face detection only as a signal of a human subject near the haircut.
- Strip or avoid storing EXIF GPS if it violates privacy expectations; use it transiently if needed and delete if not required.

Human review
- Flag images with low relevance but high visibility for manual review before removing from public profile.

Example fields written to `image_analyses.analysis` (JSON)
{
  "provenance": {"source":"yelp","score":0.25},
  "objects": {"barber_chair":0.9,"scissors":0.2},
  "faces": {"count":1,"score":0.1},
  "ocr": {"detected_text":"Tony's Barbers","score":0.08},
  "p_hash":"abc123...",
  "final_relevance":0.83,
  "final_authenticity":0.79
}

Next steps
- Implement `workers/image_processor.js` (Node or Python) and add a migration for `image_analyses` and `images.relevance_score`/`images.authenticity_score`.
- Connect worker to the crawler: after persisting images, enqueue image id for analysis.

If you'd like, I can implement the worker skeleton now in Node and add the migration. Tell me whether you prefer Node or Python for the worker runtime.
