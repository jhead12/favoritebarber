# Image Attribution System

Automatically attributes photos to individual barbers or keeps them as shop portfolio images using OpenAI-powered name extraction from captions.

## How It Works

### Attribution Rules
1. **Yelp Photos** → Default to shop (unless caption mentions exactly one barber)
2. **Social Media Photos** → Linked to barber profile if bio references the shop
3. **Caption Analysis** → OpenAI extracts barber names, attributes to individual only if exactly 1 mentioned
4. **Multiple Mentions** → Photo stays with shop (e.g., "Thanks to Carlos and Mike!")

### Database Schema
```sql
-- Added columns to images table
ALTER TABLE images ADD COLUMN caption TEXT;
ALTER TABLE images ADD COLUMN attribution_metadata JSONB;

-- Example attribution_metadata structure:
{
  "source": "caption",
  "mentioned_count": 1,
  "barber_ids": [123]
}
```

### API Response Format

**GET /api/barbers/:id**
```json
{
  "gallery": [
    {
      "id": 456,
      "url": "https://...",
      "source": "yelp",
      "relevance_score": 0.87,
      "hairstyles": ["fade", "undercut"],
      "attribution": {
        "source": "caption",
        "mentioned_count": 1,
        "barber_ids": [123]
      },
      "caption": "Amazing fade by Carlos Ruiz!"
    }
  ]
}
```

**GET /api/shops/:id**
```json
{
  "images": [
    {
      "url": "https://...",
      "hairstyles": ["fade"],
      "attribution": {
        "mentioned_count": 2,
        "barber_ids": [123, 456]
      },
      "caption": "Thanks to Carlos and Mike!"
    }
  ]
}
```

## Running the Attribution Worker

### One-time processing
```bash
# Process up to 10 images with captions
DATABASE_URL=postgresql://localhost/rateyourbarber \
OPENAI_API_KEY=sk-... \
node workers/image_attribution_worker.js --limit 10
```

### Batch backfill
```bash
# Process all pending images in batches
while true; do
  DATABASE_URL=postgresql://localhost/rateyourbarber \
  OPENAI_API_KEY=sk-... \
  node workers/image_attribution_worker.js --limit 50
  
  # Check if there are more pending
  COUNT=$(psql -d rateyourbarber -t -c "SELECT COUNT(*) FROM images WHERE caption IS NOT NULL AND attribution_metadata IS NULL")
  if [ "$COUNT" -eq 0 ]; then
    echo "All images attributed!"
    break
  fi
  echo "$COUNT images remaining..."
  sleep 2
done
```

### Automatic attribution after Yelp fetch
The Yelp fetcher stores captions in the `images` table. The attribution worker polls for images with `caption IS NOT NULL AND attribution_metadata IS NULL`.

To enable automatic processing:
1. Add worker to cron: `*/5 * * * * cd /app && node workers/image_attribution_worker.js --limit 20`
2. Or trigger from discovery daemon after job completion
3. Or use Redis/Bull queue (future enhancement)

## Testing

```bash
# Run attribution tests
DATABASE_URL=postgresql://localhost/rateyourbarber \
node --test tests/unit/test_image_attribution.js

# With OpenAI API key for live extraction tests
OPENAI_API_KEY=sk-... \
DATABASE_URL=postgresql://localhost/rateyourbarber \
node --test tests/unit/test_image_attribution.js
```

## Cost Estimates

- **OpenAI gpt-4o-mini**: ~$0.0001 per caption extraction
- **1000 images/day**: ~$0.10/day = $3/month
- **Fallback**: If OPENAI_API_KEY not set, function returns empty array (keeps shop attribution)

## Frontend Integration

Images now include:
- `gallery` array on barber profiles
- `hairstyles` tags per image
- `attribution` metadata showing if image was explicitly attributed
- `from_shop: true` flag when barber profile shows shop portfolio images

Example UI:
```jsx
{barber.gallery?.map(img => (
  <div key={img.id}>
    <img src={img.url} />
    {img.hairstyles.map(style => (
      <span className="badge">{style}</span>
    ))}
    {img.from_shop && <small>From {shopName}</small>}
  </div>
))}
```

## Future Enhancements

1. **Redis Queue**: Replace polling with Bull queue for real-time attribution
2. **Batch OpenAI Calls**: Process multiple captions in single API call (requires custom prompt)
3. **Social Profile Bio Analysis**: Use OpenAI to detect shop mentions in Instagram bios
4. **Confidence Thresholds**: Only attribute if OpenAI confidence > 0.9
5. **Name Aliases**: Support nicknames ("Big Mike" → "Michael Johnson")
