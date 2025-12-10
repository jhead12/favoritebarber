GET /api/search

Query parameters:
- `query` (string, optional)
- `lat` (float) and `lng` (float) OR `address` (string)
- `radius_m` (int, optional) — default: 48280 (30 miles)
- `limit` (int, optional)

Response: 200 OK

[
  {
    "id": "string",
    "name": "string",
    "primary_location": { "latitude": 0.0, "longitude": 0.0, "formatted_address": "string" },
    "distance_m": 0,
    "trust_score": { "value": 0, "components": { "recency": 0, "sentiment": 0, "image_quality": 0, "claimed_bonus": 0 } },
    "thumbnail_url": "string",
    "top_tags": ["string"],
    "snippet": "string"
  }
]
