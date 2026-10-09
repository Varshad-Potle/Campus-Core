CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'student',
  permission_mask BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  roll_number VARCHAR(20) UNIQUE NOT NULL,
  branch VARCHAR(100) NOT NULL,
  parent_name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL DEFAULT 4,
  phone VARCHAR(15),
  permanent_address TEXT,
  photo_url TEXT,
  resume_url TEXT,
  documents_url TEXT,
  placement_status VARCHAR(10) DEFAULT 'unplaced' CHECK (placement_status IN ('placed', 'unplaced')),
  company_name VARCHAR(100),
  job_role VARCHAR(100),
  ctc_lakhs NUMERIC(6,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS update_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  fields_to_update TEXT[],
  duration_seconds INTEGER NOT NULL,
  opened_by UUID REFERENCES users(id),
  opened_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS window_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  window_id UUID REFERENCES update_windows(id),
  user_id UUID REFERENCES users(id),
  submitted_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_user_id UUID REFERENCES users(id),
  metadata JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_roll ON student_profiles(roll_number);
CREATE INDEX IF NOT EXISTS idx_window_submissions_window ON window_submissions(window_id);
CREATE INDEX IF NOT EXISTS idx_window_submissions_user ON window_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);