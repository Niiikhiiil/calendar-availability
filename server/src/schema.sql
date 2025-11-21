-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BUSY', 'TENTATIVE');

-- CREATE TABLE IF NOT EXISTS users (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name TEXT NOT NULL,
--   email TEXT UNIQUE NOT NULL,
--   password TEXT NOT NULL,
--   department TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE TABLE IF NOT EXISTS availability (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--   start_time TIMESTAMPTZ NOT NULL,
--   end_time TIMESTAMPTZ NOT NULL,
--   status availability_status NOT NULL,
--   recurring_rule TEXT,
--   description TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW(),
--   updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_availability_user ON availability(user_id);
-- CREATE INDEX IF NOT EXISTS idx_availability_time ON availability(start_time, end_time);


-- Already sent above, but here again for copy-paste
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE availability_status AS ENUM ('AVAILABLE', 'BUSY', 'TENTATIVE','LEAVE');
CREATE TYPE user_role AS ENUM ('ADMIN', 'USER');

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  status availability_status NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,
  freq TEXT NOT NULL DEFAULT 'DAILY' CHECK (freq IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  interval INT DEFAULT 1,
  by_day TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS availability_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_id UUID REFERENCES availability_rules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  instance_date DATE NOT NULL,
  time_start TIME NOT NULL,
  time_end TIME NOT NULL,
  status availability_status NOT NULL DEFAULT 'AVAILABLE',
  description TEXT,
  is_exception BOOLEAN DEFAULT FALSE,
  exception_type TEXT CHECK (exception_type IN ('modified', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rule_id, instance_date)
);

-- Indexes
CREATE INDEX idx_instances_user_date ON availability_instances(user_id, instance_date);
CREATE INDEX idx_instances_rule ON availability_instances(rule_id);
CREATE INDEX idx_rules_user ON availability_rules(user_id);