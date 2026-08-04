/**
 * VITMATERNA — Esquema PostgreSQL 17.
 * Migraciones ordenadas e idempotentes: se aplican una sola vez al arrancar
 * (tabla schema_migrations + candado de aviso para evitar carreras).
 *
 * Notas de diseño:
 * - Columnas `seq` (IDENTITY) para conservar el orden de inserción estable
 *   en los listados del snapshot.
 * - Claves de día clínicas como DATE (se leen como 'YYYY-MM-DD').
 * - Borrado en cascada: eliminar una paciente limpia sus citas, tomas,
 *   mensajes, alertas y visitas; eliminar un usuario limpia sesión y foto.
 */

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: "esquema-inicial",
    sql: `
CREATE TABLE IF NOT EXISTS app_config (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  seed_version INTEGER NOT NULL,
  maintenance BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_message TEXT NOT NULL,
  environment TEXT NOT NULL CHECK (environment IN ('demo', 'produccion')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  dni TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER NOT NULL,
  community TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  fum_key DATE NOT NULL,
  gestas INTEGER NOT NULL DEFAULT 1 CHECK (gestas >= 0),
  cesareas INTEGER NOT NULL DEFAULT 0 CHECK (cesareas >= 0),
  abortos INTEGER NOT NULL DEFAULT 0 CHECK (abortos >= 0),
  obito_fetal BOOLEAN NOT NULL DEFAULT FALSE,
  rh_sensibilizado BOOLEAN NOT NULL DEFAULT FALSE,
  antecedentes TEXT[] NOT NULL DEFAULT '{}',
  hb_observed NUMERIC(4,1) NOT NULL,
  bp_sys INTEGER NOT NULL,
  bp_dia INTEGER NOT NULL,
  imc NUMERIC(4,1) NOT NULL,
  adherence_base INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  dni TEXT PRIMARY KEY CHECK (dni ~ '^[0-9]{8}$'),
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('gestante', 'obstetra', 'admin')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  patient_id TEXT REFERENCES patients(id) ON DELETE SET NULL,
  phone TEXT,
  avatar_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  control INTEGER,
  week INTEGER,
  date_key DATE NOT NULL,
  time TEXT NOT NULL CHECK (time ~ '^[0-9]{2}:[0-9]{2}$'),
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (
    estado IN ('programada', 'confirmada', 'asistida', 'no_asistida', 'solicitud_reprogramacion')
  ),
  lugar TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments (patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date_key);

CREATE TABLE IF NOT EXISTS supplements (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  dose TEXT NOT NULL DEFAULT '1 tableta',
  schedule TEXT NOT NULL DEFAULT '',
  times_per_day INTEGER NOT NULL DEFAULT 1 CHECK (times_per_day BETWEEN 1 AND 6),
  start_key DATE
);
CREATE INDEX IF NOT EXISTS idx_supplements_patient ON supplements (patient_id);

CREATE TABLE IF NOT EXISTS intakes (
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  day_key DATE NOT NULL,
  supplement_id TEXT NOT NULL REFERENCES supplements(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 1 CHECK (count BETWEEN 1 AND 12),
  PRIMARY KEY (patient_id, day_key, supplement_id)
);

CREATE TABLE IF NOT EXISTS messages (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  conv_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('gestante', 'obstetra')),
  kind TEXT NOT NULL CHECK (kind IN ('text', 'emergencia', 'alarma')),
  text TEXT NOT NULL,
  at_iso TIMESTAMPTZ NOT NULL,
  read_by_gestante BOOLEAN NOT NULL DEFAULT FALSE,
  read_by_obstetra BOOLEAN NOT NULL DEFAULT FALSE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages (conv_id, seq);

CREATE TABLE IF NOT EXISTS alerts (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (
    type IN ('emergencia', 'alarma', 'inasistencia', 'adherencia', 'anemia', 'sin_control')
  ),
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  at_iso TIMESTAMPTZ NOT NULL,
  title TEXT NOT NULL,
  detail TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('abierta', 'atendida')),
  note TEXT,
  attended_at_iso TIMESTAMPTZ,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION
);
CREATE INDEX IF NOT EXISTS idx_alerts_patient ON alerts (patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);

CREATE TABLE IF NOT EXISTS visits (
  seq BIGINT GENERATED ALWAYS AS IDENTITY UNIQUE,
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date_key DATE NOT NULL,
  time TEXT NOT NULL CHECK (time ~ '^[0-9]{2}:[0-9]{2}$'),
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('programada', 'realizada')),
  resultado TEXT,
  created_at_iso TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_visits_patient ON visits (patient_id);
CREATE INDEX IF NOT EXISTS idx_visits_date ON visits (date_key);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  dni TEXT NOT NULL REFERENCES users(dni) ON DELETE CASCADE,
  at_iso TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_dni ON sessions (dni);

CREATE TABLE IF NOT EXISTS applied_actions (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS avatars (
  dni TEXT PRIMARY KEY REFERENCES users(dni) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  bytes BYTEA NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`,
  },
];
