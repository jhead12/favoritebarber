# RateYourBarber Test Suite

Comprehensive test coverage for the RateYourBarber platform.

## Test Organization

```
tests/
├── unit/                    # Unit tests (isolated, fast)
│   ├── test_mcp_auth.js            # MCP authentication middleware
│   ├── test_mcp_rate_limiter.js    # Rate limiting logic
│   └── ...
├── integration/             # Integration tests (require services)
│   ├── test_mcp_e2e.js             # MCP end-to-end flow
│   ├── test_yelp_graphql_flow.js   # Yelp GraphQL integration
│   ├── test_image_processor.js     # Image processing pipeline
│   └── ...
├── smoke/                   # Smoke tests (production health checks)
│   └── api_smoke.js
├── fixtures/                # Test data and mock responses
│   ├── llm_golden.json
│   └── yelp_graphql/
└── results/                 # Test output and reports
```

## Running Tests

### MCP Server Tests

**Unit Tests** (no external dependencies):
```bash
# Authentication tests
node --test tests/unit/test_mcp_auth.js

# Rate limiter tests
node --test tests/unit/test_mcp_rate_limiter.js

# All unit tests
node --test tests/unit/test_mcp*.js
```

**Integration Tests** (requires running services):
```bash
# Prerequisites:
# 1. Start PostgreSQL: brew services start postgresql@14
# 2. Apply migrations: npm run migrate
# 3. Start Redis: brew services start redis
# 4. Start API server: npm --prefix api start

# E2E tests
node --test tests/integration/test_mcp_e2e.js

# All MCP tests
npm run test:mcp
```

### Yelp GraphQL Tests

```bash
# Integration tests (uses fixtures)
node tests/integration/test_yelp_graphql_flow.js

# Live API tests (requires YELP_API_KEY)
YELP_API_KEY=your_key_here node api/test_yelp_graphql.js
```

### LLM Tests

```bash
# Golden dataset tests (uses mock provider)
npm run test:llm

# Provider benchmark (requires provider API keys)
node workers/llm/benchmark_providers.js --providers=ollama,openai

# Moderation tests
npm run test:moderation
```

### Legacy Tests

**Smoke tests**:
```bash
# Ping API endpoints
API_BASE=http://localhost:3000 node tests/smoke/api_smoke.js
# Or use npm script
npm run test:smoke
```

**Integration tests**:
```bash
# Image processor integration test
npm run test:integration
```

## Test Configuration

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```bash
# Database
DATABASE_URL=postgresql://localhost/favorite_barber_test

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
API_BASE=http://localhost:3000

# Yelp (optional, for live tests)
YELP_API_KEY=your_test_key

# LLM Providers (optional)
LLM_PROVIDER=mock
OLLAMA_ENDPOINT=http://localhost:11434
```

### Test Database Setup

```bash
# Create test database
createdb favorite_barber_test

# Apply migrations
DATABASE_URL=postgresql://localhost/favorite_barber_test npm run migrate

# Seed test data (optional)
DATABASE_URL=postgresql://localhost/favorite_barber_test node api/scripts/seed_llm_testbed.js
```

## MCP Test Coverage

### Authentication Tests (`test_mcp_auth.js`)
- ✅ API key generation (test/live environments)
- ✅ Bearer token validation
- ✅ Bcrypt hash verification
- ✅ Key revocation
- ✅ Expired key rejection
- ✅ Scope enforcement
- ✅ Missing/invalid authorization handling

### Rate Limiting Tests (`test_mcp_rate_limiter.js`)
- ✅ Per-minute rate limiting
- ✅ Per-day quota enforcement
- ✅ Unlimited quota support
- ✅ Rate limit headers
- ✅ 429 response on limit exceeded
- ✅ Retry-After header
- ✅ Fail-open on Redis errors
- ✅ Rate limit status queries
- ✅ Admin rate limit reset

### End-to-End Tests (`test_mcp_e2e.js`)
- ✅ Full authentication flow
- ✅ Rate limiting in production context
- ✅ Request logging to database
- ✅ Scope enforcement across endpoints
- ✅ Error responses and status codes
- ⏳ **Pending**: Endpoint-specific tests (once implemented)

## Writing New Tests

### Unit Test Template

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

describe('Feature Name', () => {
  before(async () => {
    // Setup: create test data, connections
  });

  after(async () => {
    // Teardown: clean up test data
  });

  describe('Function Name', () => {
    it('should handle expected case', async () => {
      // Arrange
      const input = { /* test data */ };

      // Act
      const result = await functionUnderTest(input);

      // Assert
      assert.strictEqual(result.status, 'success');
    });

    it('should handle edge case', async () => {
      // Test edge cases
    });
  });
});
```

### Integration Test Template

```javascript
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');

describe('Feature Integration', () => {
  before(async () => {
    // Start required services (DB, Redis, etc.)
    // Seed test data
  });

  after(async () => {
    // Clean up test data
    // Close connections
  });

  it('should complete full workflow', async () => {
    // Test complete user workflow end-to-end
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow (Recommended)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: favorite_barber_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm --prefix api install
          npm --prefix workers install
      
      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/favorite_barber_test
        run: npm run migrate
      
      - name: Run unit tests
        run: node --test tests/unit/test_mcp*.js
      
      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost/favorite_barber_test
          REDIS_HOST: localhost
        run: node --test tests/integration/*.js
```

## Test Metrics & Goals

### Current Coverage
- **MCP Auth**: 90%+ (8/8 critical paths)
- **MCP Rate Limiter**: 85%+ (10/11 scenarios)
- **MCP E2E**: 60% (pending endpoint implementation)
- **LLM Tests**: 90%+ (golden dataset coverage)

### Target Coverage
- **Unit Tests**: 85%+ line coverage
- **Integration Tests**: 100% critical user flows
- **Smoke Tests**: All production endpoints

## Troubleshooting

### Common Issues

**Tests fail with "Connection refused"**
- Ensure PostgreSQL is running: `brew services list`
- Check DATABASE_URL in .env.test
- Verify test database exists: `psql -l`

**Redis connection errors**
- Start Redis: `brew services start redis`
- Verify connection: `redis-cli ping`
- Check REDIS_HOST and REDIS_PORT

**"Table does not exist" errors**
- Apply migrations to test DB: `DATABASE_URL=postgresql://localhost/favorite_barber_test npm run migrate`

**Rate limit tests fail intermittently**
- Redis keys may persist between runs
- Use separate Redis DB for tests (db: 1)
- Clear test keys in `before()` hooks

**"Module not found" errors**
- Install dependencies: `npm --prefix api install`
- Ensure working directory is repository root

## Resources

- [Node.js Test Runner](https://nodejs.org/api/test.html)
- [MCP Design Document](../docs/MCP_DESIGN.md)
- [MCP Roadmap](../docs/MCP_ROADMAP.md)
- [LLM Testing Guide](../docs/LLM_TESTING_QUICKSTART.md)

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Ensure tests pass locally
3. Add test documentation to this README
4. Update coverage metrics
5. Consider adding CI checks for new test suites
