# Hairstyle Detection from Yelp Images - Complete Workflow

## Overview

This document explains how the system fetches images from Yelp API, analyzes them with vision models, detects hairstyles, and associates them with barbers and shops.

## Current Status

✅ **Implemented:**
- Yelp API fetcher that retrieves business photos
- Image storage in database with barber/shop associations
- Vision analysis using Google Cloud Vision (with heuristic fallback)
- Hairstyle detection from image labels and OCR text
- Comprehensive canonical hairstyle vocabulary (25+ styles)
- Database schema with `hairstyles` JSONB column on images table
- Test suite for hairstyle detection

⚠️ **Needs Integration:**
- Automatic triggering of vision analysis after Yelp fetch
- Background job queue for image processing (currently TODO comment)

## Complete Workflow

### 1. Fetch Images from Yelp API

**File:** `workers/crawlers/yelp_fetcher.ts`

The Yelp fetcher:
1. Searches for barber businesses by location
2. Fetches business details including **photos array**
3. Stores photos in the `images` table with:
   - `url` - Direct link to Yelp-hosted image
   - `barber_id` - Associated barber
   - `shop_id` - Associated shop
   - `source` - 'yelp'
   - `source_id` - Yelp business ID

**Key Function:** `upsertImages()` at line 104
```typescript
async function upsertImages(barberId, business, shopId=null) {
  const photos = business.photos || [];
  for (const url of photos) {
    // ... insert into images table
    // TODO: enqueue image processing job here
  }
}
```

**How to Run:**
```bash
# Set your Yelp API key
export YELP_API_KEY=your_key_here

# Fetch barbers from a location
node -r ts-node/register workers/crawlers/yelp_fetcher.ts "San Francisco, CA"
```

### 2. Analyze Images with Vision API

**File:** `workers/image_processor.js`

The image processor:
1. Fetches unanalyzed images from database
2. Calls Google Cloud Vision API (or local heuristic fallback)
3. Gets:
   - **Labels** - Object/scene detection (e.g., "fade haircut", "barber", "scissors")
   - **OCR text** - Reads text in images (e.g., menu boards with services)
   - **Face detection** - Counts faces for relevance scoring
   - **SafeSearch** - Content moderation
4. Detects hairstyles from labels/text
5. Persists results to `image_analyses` table
6. Updates `images` table with:
   - `relevance_score` - How relevant to barbering (0-1)
   - `authenticity_score` - Trustworthiness score (0-1)
   - `hairstyles` - JSONB array of detected styles

**Key Function:** `detectHairstylesFromAnalysis()` at line 137

**How to Run:**
```bash
# Process pending images
node workers/image_processor.js --pending 50

# Process sample data (simulation mode)
node workers/image_processor.js --sample
```

### 3. Hairstyle Detection Algorithm

**File:** `workers/image_processor.js` lines 137-189

The detection algorithm:
1. Collects text from:
   - Vision API labels (e.g., "high fade", "undercut")
   - OCR text (e.g., "Services: Fade $30, Buzz Cut $25")
2. Converts to lowercase
3. Searches for keyword matches against canonical vocabulary
4. Returns unique set of detected canonical hairstyles

**Example:**
- Input label: "Taper fade haircut"
- Matches: "taper fade" → canonical "fade", "taper" → canonical "taper"
- Output: `["fade", "taper"]`

**Canonical Vocabulary** (from `docs/HAIRSTYLES.md`):
- fade, taper, buzz cut, crew cut, caesar, ivy league
- undercut, pompadour, quiff, slick back, comb over
- french crop, textured crop, curly top, afro, twist/coils
- mohawk, mullet, long layered, shag, bowl cut, wolf cut
- man bun, fringe, scissor cut, beard trim

### 4. Associate Hairstyles with Barbers & Shops

Once images are analyzed, hairstyles are automatically associated through database relationships:

**Query barber specialties:**
```sql
SELECT 
  b.name,
  array_agg(DISTINCT style) as hairstyles
FROM barbers b
LEFT JOIN images i ON i.barber_id = b.id
LEFT JOIN LATERAL jsonb_array_elements_text(i.hairstyles) AS style ON true
WHERE b.name IS NOT NULL
GROUP BY b.id, b.name;
```

**Query shop services:**
```sql
SELECT 
  s.name,
  array_agg(DISTINCT style) as hairstyles
FROM shops s
LEFT JOIN images i ON i.shop_id = s.id
LEFT JOIN LATERAL jsonb_array_elements_text(i.hairstyles) AS style ON true
WHERE s.name IS NOT NULL
GROUP BY s.id, s.name;
```

## Testing the Workflow

### Unit Tests for Hairstyle Detection

**File:** `workers/test_hairstyle_vision.js`

Tests 14 scenarios including:
- Single and multiple style detection
- Synonym matching
- OCR text parsing
- Complex service menus
- Edge cases (no styles detected)

**Run unit tests:**
```bash
node workers/test_hairstyle_vision.js
```

**Test against database:**
```bash
node workers/test_hairstyle_vision.js --db
```

### End-to-End Workflow Test

**File:** `workers/test_e2e_hairstyle_workflow.js`

**Check current state:**
```bash
node workers/test_e2e_hairstyle_workflow.js --dry-run
```

**View detailed results:**
```bash
node workers/test_e2e_hairstyle_workflow.js --process-pending
```

## Integration Checklist

To fully connect the workflow:

- [ ] **Add job queue** (Redis + Bull or similar)
  - Create queue in `workers/index.js`
  - Add producer in `upsertImages()` after Yelp fetch
  - Add consumer that calls image processor

- [ ] **Google Vision setup**
  - Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
  - Or configure gcloud: `gcloud auth application-default login`
  - Install SDK: `npm install @google-cloud/vision`

- [ ] **Automatic reprocessing**
  - Cron job or scheduled task to process pending images
  - Reprocess images when hairstyle vocabulary updates

- [ ] **Frontend integration**
  - Display barber/shop hairstyle specialties
  - Filter search results by hairstyle
  - Show example images for each style

## Example: Full Flow

```bash
# 1. Fetch barbers from Yelp (stores images)
export YELP_API_KEY=your_key
node -r ts-node/register workers/crawlers/yelp_fetcher.ts "Brooklyn, NY"

# 2. Process the fetched images
export GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json
node workers/image_processor.js --pending 50

# 3. View results in database
psql -d rateyourbarber -c "
  SELECT 
    b.name,
    i.hairstyles,
    i.relevance_score
  FROM images i
  JOIN barbers b ON b.id = i.barber_id
  WHERE jsonb_array_length(i.hairstyles) > 0
  LIMIT 10;
"

# 4. Run comprehensive test
node workers/test_hairstyle_vision.js --db
```

## Vision API Cost Considerations

**Google Cloud Vision pricing (as of 2024):**
- First 1,000 images/month: Free
- After that: ~$1.50 per 1,000 images
- Label detection + Text detection = 2 features per image

**Optimization strategies:**
1. Cache analysis results (already implemented)
2. Process only high-quality images (filter by size/source)
3. Batch processing during off-peak hours
4. Use local heuristic analyzer for development/testing

## Next Steps

1. **Compile TypeScript workers** or convert to JavaScript
2. **Set up Google Cloud Vision** credentials
3. **Add background job queue** (Redis + Bull)
4. **Fetch real data** from Yelp API
5. **Process images** and verify hairstyle detection
6. **Build frontend features** to display and filter by hairstyles

## Questions?

- **Q: Are we getting images from Yelp?**
  - **A:** Yes! The `yelp_fetcher.ts` fetches business photos from the Yelp API and stores them in the `images` table.

- **Q: How do we determine hairstyles?**
  - **A:** We use Google Cloud Vision to detect labels/OCR, then map those to canonical hairstyles from our vocabulary.

- **Q: What if Vision API isn't available?**
  - **A:** The system falls back to a heuristic analyzer that makes educated guesses based on URL patterns and source.

- **Q: How are hairstyles associated with barbers?**
  - **A:** Through the `images` table relationship - each image has `barber_id` and `hairstyles` JSON array.
