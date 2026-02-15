-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Countries table
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  currency_code CHAR(3) NOT NULL,
  currency_name TEXT NOT NULL
);

-- Schools table
CREATE TABLE schools (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  name_normalized TEXT NOT NULL,
  country_id INT NOT NULL REFERENCES countries(id),
  is_user_submitted BOOLEAN DEFAULT false,
  UNIQUE(name, country_id)
);

CREATE INDEX idx_schools_country ON schools(country_id);
CREATE INDEX idx_schools_name_trgm ON schools USING GIN (name_normalized gin_trgm_ops);

-- Submissions table
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id INT REFERENCES schools(id),
  new_school_name TEXT,
  new_school_country TEXT,
  position TEXT NOT NULL CHECK (position IN (
    'classroom_teacher',
    'teacher_additional_responsibilities',
    'middle_leader',
    'senior_leader_other',
    'senior_leader_head'
  )),
  gross_pay NUMERIC(12,2) NOT NULL,
  gross_currency CHAR(3) NOT NULL,
  gross_usd NUMERIC(12,2),
  gross_gbp NUMERIC(12,2),
  gross_eur NUMERIC(12,2),
  gross_local NUMERIC(12,2),
  local_currency_code CHAR(3),
  accommodation_type TEXT NOT NULL CHECK (accommodation_type IN (
    'allowance', 'provided_furnished', 'provided_unfurnished', 'not_provided'
  )),
  accommodation_allowance NUMERIC(12,2),
  accommodation_currency CHAR(3),
  accommodation_usd NUMERIC(12,2),
  accommodation_gbp NUMERIC(12,2),
  accommodation_eur NUMERIC(12,2),
  accommodation_local NUMERIC(12,2),
  net_pay NUMERIC(12,2),
  net_currency CHAR(3),
  net_usd NUMERIC(12,2),
  net_gbp NUMERIC(12,2),
  net_eur NUMERIC(12,2),
  net_local NUMERIC(12,2),
  tax_not_applicable BOOLEAN DEFAULT false,
  pension_offered BOOLEAN,
  pension_percentage NUMERIC(5,2),
  child_places TEXT CHECK (child_places IN ('0', '1', '2', '2_plus')),
  child_places_detail TEXT,
  medical_insurance BOOLEAN,
  medical_insurance_detail TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  exchange_rate_date DATE
);

CREATE INDEX idx_submissions_school ON submissions(school_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- Exchange rates cache
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  base_currency CHAR(3) DEFAULT 'USD',
  rate_date DATE NOT NULL,
  rates JSONB NOT NULL,
  UNIQUE(base_currency, rate_date)
);

-- Admin sessions
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);
