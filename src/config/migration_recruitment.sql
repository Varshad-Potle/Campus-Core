ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS ssc_percentage          NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS hsc_diploma_percentage  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cgpa                    NUMERIC(4,2);

CREATE TABLE IF NOT EXISTS companies (
  id                         SERIAL PRIMARY KEY,
  name                       VARCHAR(200) NOT NULL,
  description                TEXT,
  visit_date                 DATE,
  application_deadline      TIMESTAMPTZ,
  min_ssc_percentage         NUMERIC(5,2),
  min_hsc_percentage         NUMERIC(5,2),
  min_cgpa                   NUMERIC(4,2),
  ctc_lakhs                  NUMERIC(6,2),
  internship_offered         BOOLEAN NOT NULL DEFAULT FALSE,
  internship_paid            BOOLEAN,
  internship_stipend         NUMERIC(8,2),
  internship_duration_months INTEGER,
  ppo_opportunity            BOOLEAN NOT NULL DEFAULT FALSE,
  service_bond_months        INTEGER,
  service_bond_amount        NUMERIC(10,2),
  note                       TEXT,
  is_active                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_by                 UUID REFERENCES users(id),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS application_deadline TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS applications (
  id          SERIAL PRIMARY KEY,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'applied'
                CHECK (status IN ('applied','shortlisted','interview','selected','rejected')),
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES users(id),
  UNIQUE (student_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_applications_student ON applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_active     ON companies(is_active);
