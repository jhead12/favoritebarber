# Yelp GraphQL Test Fixtures

Test data for validating the Yelp GraphQL integration pipeline.

## Files

- **`sample_business.json`** — Complete business record with all GraphQL fields
  - Business details (id, name, rating, review_count)
  - Price range (`$$`)
  - Opening hours (7 days)
  - Categories (Barbers, Hair Salons)
  - Location with coordinates
  - 2 business photos

- **`sample_reviews.json`** — Array of 3 sample reviews
  - Mix of ratings (5, 4, 3 stars)
  - User details with profile photos
  - One review with null user photo (edge case)

## Usage

These fixtures are used by `tests/integration/test_yelp_graphql_flow.js` to verify:
- GraphQL response normalization
- Field mapping to internal schema
- Handling of optional/null fields
- Image and user data extraction

## Adding New Fixtures

When adding new test cases:
1. Follow the same JSON structure as Yelp's GraphQL API
2. Include edge cases (null values, empty arrays, missing fields)
3. Update the integration test to cover new scenarios
