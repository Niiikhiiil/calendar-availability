-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Status enum
CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BUSY', 'TENTATIVE');

-- Users table (unchanged)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MASTER recurring rules (one row = one recurring availability)
CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Date range when this rule is active
  start_date DATE NOT NULL,        -- e.g. 2025-11-19
  end_date DATE,                   -- optional: null = indefinite

  -- Daily time slot
  time_start TIME NOT NULL,        -- e.g. 13:00:00
  time_end TIME NOT NULL,          -- e.g. 14:00:00

  -- Status & description
  status availability_status NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,

  -- Recurrence
  freq TEXT CHECK (freq IN ('DAILY', 'WEEKLY', 'MONTHLY')) NOT NULL DEFAULT 'DAILY',
  interval INT DEFAULT 1,
  by_day TEXT[],                   -- e.g. {'MO','TU','WE'} for weekly
  by_month_day INT[],              -- e.g. {1,15} for 1st and 15th

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual calendar days (expanded + exceptions)
CREATE TABLE IF NOT EXISTS availability_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES availability_rules(id) ON DELETE CASCADE, -- null = one-time event
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  instance_date DATE NOT NULL,           -- e.g. 2025-11-19
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,

  status availability_status NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,

  -- If this instance was modified or deleted from the series
  is_exception BOOLEAN DEFAULT FALSE,
  exception_type TEXT CHECK (exception_type IN ('modified', 'deleted')) NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicates
  UNIQUE(rule_id, instance_date)
);

-- Indexes for speed
CREATE INDEX idx_availability_instances_user_date 
  ON availability_instances(user_id, instance_date);

CREATE INDEX idx_availability_instances_rule 
  ON availability_instances(rule_id);

CREATE INDEX idx_availability_rules_user 
  ON availability_rules(user_id);


-- CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);
-- CREATE INDEX IF NOT EXISTS idx_availability_time ON availability(start_time, end_time);
