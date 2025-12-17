-- Migration 030: MCP (Model Context Protocol) Partner Infrastructure
-- Creates tables for external partner access, API keys, quotas, and telemetry

-- Partners table: organizations/apps accessing the MCP API
CREATE TABLE IF NOT EXISTS mcp_partners (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  email TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL DEFAULT 'free', -- 'free', 'partner', 'enterprise', 'internal'
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
  
  -- Scopes (JSON array of permissions)
  scopes JSONB DEFAULT '["read:barbers", "read:reviews"]'::jsonb,
  
  -- Rate limits
  rate_limit_per_minute INTEGER NOT NULL DEFAULT 60,
  quota_per_day INTEGER NOT NULL DEFAULT 10000,
  
  -- Billing
  monthly_price_usd NUMERIC(10, 2) DEFAULT 0,
  billing_email TEXT,
  
  -- Metadata
  notes TEXT, -- internal notes about partner
  onboarded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API keys table: credentials for partner authentication
CREATE TABLE IF NOT EXISTS mcp_api_keys (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES mcp_partners(id) ON DELETE CASCADE,
  
  -- Key details
  key_hash TEXT NOT NULL UNIQUE, -- bcrypt hash of API key
  key_prefix TEXT NOT NULL, -- 'ryb_test_abc' or 'ryb_live_abc' (first 16 chars for display)
  name TEXT, -- optional human-readable name ('Production Key', 'Staging Key')
  
  -- Key status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'revoked', 'expired'
  environment TEXT NOT NULL DEFAULT 'test', -- 'test' or 'live'
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  usage_count BIGINT DEFAULT 0,
  
  -- Expiration
  expires_at TIMESTAMPTZ, -- null = never expires
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT
);

-- Request logs table: telemetry for partner API calls
CREATE TABLE IF NOT EXISTS mcp_request_logs (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES mcp_partners(id) ON DELETE CASCADE,
  api_key_id INTEGER REFERENCES mcp_api_keys(id) ON DELETE SET NULL,
  
  -- Request details
  request_id TEXT NOT NULL UNIQUE, -- X-Request-ID correlation ID
  method TEXT NOT NULL, -- GET, POST, PUT, DELETE
  endpoint TEXT NOT NULL, -- '/mcp/v1/barbers/search'
  query_params JSONB, -- URL query parameters
  
  -- Response details
  status_code INTEGER NOT NULL,
  response_time_ms INTEGER NOT NULL,
  
  -- Yelp proxy tracking (for live-Yelp endpoints)
  yelp_calls INTEGER DEFAULT 0, -- number of Yelp API calls made for this request
  yelp_cost_estimate_usd NUMERIC(10, 4) DEFAULT 0, -- estimated Yelp API cost
  
  -- Metadata
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quota usage table: daily aggregated quota tracking per partner
CREATE TABLE IF NOT EXISTS mcp_quota_usage (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES mcp_partners(id) ON DELETE CASCADE,
  date DATE NOT NULL, -- usage date
  
  -- Daily counters
  requests_total INTEGER NOT NULL DEFAULT 0,
  requests_success INTEGER NOT NULL DEFAULT 0, -- 2xx status codes
  requests_error INTEGER NOT NULL DEFAULT 0, -- 4xx/5xx status codes
  
  -- Yelp proxy usage (live-Yelp endpoints)
  yelp_calls_total INTEGER NOT NULL DEFAULT 0,
  yelp_cost_total_usd NUMERIC(10, 2) DEFAULT 0,
  
  -- Performance
  avg_response_time_ms INTEGER,
  p95_response_time_ms INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(partner_id, date)
);

-- Webhooks table: partner webhook subscriptions
CREATE TABLE IF NOT EXISTS mcp_webhooks (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER NOT NULL REFERENCES mcp_partners(id) ON DELETE CASCADE,
  
  -- Webhook configuration
  url TEXT NOT NULL, -- partner's webhook endpoint
  events TEXT[] NOT NULL, -- ['review.created', 'barber.verified', 'trust_score.updated']
  secret TEXT NOT NULL, -- HMAC secret for signature validation
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'paused', 'failed'
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook deliveries table: track webhook delivery attempts
CREATE TABLE IF NOT EXISTS mcp_webhook_deliveries (
  id SERIAL PRIMARY KEY,
  webhook_id INTEGER NOT NULL REFERENCES mcp_webhooks(id) ON DELETE CASCADE,
  
  -- Delivery details
  event_type TEXT NOT NULL, -- 'review.created'
  payload JSONB NOT NULL,
  
  -- Delivery status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
  attempts INTEGER DEFAULT 0,
  response_code INTEGER,
  response_body TEXT,
  
  -- Timing
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_partners_tier ON mcp_partners(tier) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mcp_partners_email ON mcp_partners(email);

CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_partner ON mcp_api_keys(partner_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_hash ON mcp_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_mcp_api_keys_last_used ON mcp_api_keys(last_used_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_mcp_request_logs_partner_date ON mcp_request_logs(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_request_logs_request_id ON mcp_request_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_mcp_request_logs_created ON mcp_request_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_quota_usage_partner_date ON mcp_quota_usage(partner_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_quota_usage_date ON mcp_quota_usage(date DESC);

CREATE INDEX IF NOT EXISTS idx_mcp_webhooks_partner ON mcp_webhooks(partner_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_mcp_webhook_deliveries_webhook ON mcp_webhook_deliveries(webhook_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_webhook_deliveries_retry ON mcp_webhook_deliveries(next_retry_at) WHERE status = 'failed' AND attempts < 5;

-- Comments for documentation
COMMENT ON TABLE mcp_partners IS 'External partners/apps accessing the MCP API';
COMMENT ON TABLE mcp_api_keys IS 'API keys for partner authentication (hashed)';
COMMENT ON TABLE mcp_request_logs IS 'Telemetry logs for all MCP API requests (30-day retention)';
COMMENT ON TABLE mcp_quota_usage IS 'Daily aggregated quota usage per partner (1-year retention)';
COMMENT ON TABLE mcp_webhooks IS 'Partner webhook subscriptions for event notifications';
COMMENT ON TABLE mcp_webhook_deliveries IS 'Webhook delivery tracking and retry queue';

COMMENT ON COLUMN mcp_partners.scopes IS 'JSON array of permissions: ["read:barbers", "read:reviews", "read:live_yelp", "write:webhooks"]';
COMMENT ON COLUMN mcp_api_keys.key_hash IS 'Bcrypt hash of full API key (never store plaintext)';
COMMENT ON COLUMN mcp_api_keys.key_prefix IS 'First 16 chars of key for display (e.g., "ryb_live_abc123x")';
COMMENT ON COLUMN mcp_request_logs.yelp_calls IS 'Number of Yelp GraphQL calls made to serve this MCP request';
COMMENT ON COLUMN mcp_webhooks.secret IS 'HMAC secret for webhook signature verification';

-- Seed internal partner for RateYourBarber's own frontend
INSERT INTO mcp_partners (name, company, email, tier, status, scopes, rate_limit_per_minute, quota_per_day, monthly_price_usd)
VALUES (
  'RateYourBarber Internal',
  'RateYourBarber Inc.',
  'internal@rateyourbarber.com',
  'internal',
  'active',
  '["read:barbers", "read:reviews", "read:analytics", "read:live_yelp", "write:admin", "write:webhooks", "write:discover"]'::jsonb,
  999999,
  99999999,
  0
) ON CONFLICT DO NOTHING;

-- Create trigger to update `updated_at` on partner changes
CREATE OR REPLACE FUNCTION update_mcp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they already exist (safe idempotent migration)
DROP TRIGGER IF EXISTS trigger_mcp_partners_updated_at ON mcp_partners;
CREATE TRIGGER trigger_mcp_partners_updated_at
  BEFORE UPDATE ON mcp_partners
  FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at();

DROP TRIGGER IF EXISTS trigger_mcp_quota_usage_updated_at ON mcp_quota_usage;
CREATE TRIGGER trigger_mcp_quota_usage_updated_at
  BEFORE UPDATE ON mcp_quota_usage
  FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at();

DROP TRIGGER IF EXISTS trigger_mcp_webhooks_updated_at ON mcp_webhooks;
CREATE TRIGGER trigger_mcp_webhooks_updated_at
  BEFORE UPDATE ON mcp_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_mcp_updated_at();
