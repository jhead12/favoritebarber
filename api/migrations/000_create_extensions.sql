-- Ensure required Postgres extensions are available
-- `gen_random_uuid()` requires the `pgcrypto` extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;
