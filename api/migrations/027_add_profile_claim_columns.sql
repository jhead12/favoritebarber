-- Add claim fields to barber_profiles and shops to support barber profile claiming
BEGIN;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID;
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed';
ALTER TABLE barber_profiles ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMP;

-- Optional shop level claim metadata for owner-claimed shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS claimed_by_user_id UUID;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed';
ALTER TABLE shops ADD COLUMN IF NOT EXISTS claim_requested_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_barber_profiles_claimed_by ON barber_profiles (claimed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_shops_claimed_by ON shops (claimed_by_user_id);
COMMIT;
