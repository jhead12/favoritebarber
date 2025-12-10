-- migration: create social_profiles table to store discovered social accounts
CREATE TABLE IF NOT EXISTS social_profiles (
  id SERIAL PRIMARY KEY,
  platform TEXT,
  handle TEXT,
  profile_url TEXT,
  name TEXT,
  evidence JSONB,
  confidence NUMERIC DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS social_profiles_platform_handle_idx ON social_profiles(platform, handle);
