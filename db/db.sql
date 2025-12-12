CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    medical_record_no VARCHAR(32) NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    phone TEXT,
    address TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS registrations (
    id BIGSERIAL PRIMARY KEY,
    registration_no VARCHAR(32) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL REFERENCES patients(id),
    registration_date TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sequence_counters (
    id BIGSERIAL PRIMARY KEY,
    sequence_date DATE NOT NULL,
    sequence_type VARCHAR(8) NOT NULL,
    last_value INT NOT NULL DEFAULT 0,
    UNIQUE (sequence_date, sequence_type)
);

CREATE INDEX IF NOT EXISTS idx_patients_name ON patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients (date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_not_deleted ON patients (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_registrations_registration_no ON registrations (registration_no);
CREATE INDEX IF NOT EXISTS idx_registrations_patient_id ON registrations (patient_id);
CREATE INDEX IF NOT EXISTS idx_registrations_date ON registrations (registration_date DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_not_deleted ON registrations (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_sequence_date_type ON sequence_counters (sequence_date, sequence_type);

