-- Migration: Switch from IPHub to ipapi.is
-- Run this against your existing Supabase database

-- 1. Add new IP detail columns to submissions (if not already present)
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS vpn_flagged BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ip_is_vpn BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ip_is_tor BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ip_is_proxy BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ip_is_abuser BOOLEAN DEFAULT false;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS ip_country TEXT;

-- 2. Create visitor_ips table
CREATE TABLE IF NOT EXISTS visitor_ips (
  id SERIAL PRIMARY KEY,
  ip_address TEXT UNIQUE NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  visit_count INT DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_visitor_ips_last_seen ON visitor_ips(last_seen DESC);

-- 3. Create upsert function for visitor IP tracking
CREATE OR REPLACE FUNCTION upsert_visitor_ip(p_ip TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO visitor_ips (ip_address, first_seen, last_seen, visit_count)
  VALUES (p_ip, now(), now(), 1)
  ON CONFLICT (ip_address)
  DO UPDATE SET
    last_seen = now(),
    visit_count = visitor_ips.visit_count + 1;
END;
$$ LANGUAGE plpgsql;
