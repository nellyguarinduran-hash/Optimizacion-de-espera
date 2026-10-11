/*
# Create TurnoMédico Live database schema

## Overview
Creates the full database schema for the TurnoMédico Live application — a medical
waiting room management system with geolocated patient check-in, real-time queue
management, countdown timers, and admin configuration.

## New Tables

1. `users` — Stores all system users (doctors, patients, admins) identified by
   their Colombian Cédula de Ciudadanía.
   - `cedula` (text, primary key) — National ID number, unique per user.
   - `name` (text) — Full display name.
   - `role` (text) — One of: 'doctor', 'patient', 'admin'.
   - `sede_name` (text, nullable) — Name of the sede this user is assigned to
     (primarily for doctors).
   - `created_at` (timestamptz) — Record creation timestamp.

2. `appointments` — Stores patient appointments / queue entries.
   - `id` (uuid, primary key) — Unique appointment ID.
   - `patient_cedula` (text, FK → users.cedula) — The patient's cedula.
   - `patient_name` (text) — Denormalized patient name for quick display.
   - `scheduled_time` (text) — Appointment time in HH:MM format.
   - `status` (text) — One of: 'scheduled', 'checked-in', 'called',
     'in-attendance', 'attended', 'absent', 'rescheduled'.
   - `ticket_number` (integer) — Queue position number.
   - `check_in_time` (bigint, nullable) — Check-in timestamp (epoch ms).
   - `called_at` (bigint, nullable) — When the doctor called this patient (epoch ms).
   - `gps_distance` (integer, nullable) — Distance in meters from the sede at check-in.
   - `attendance_start_at` (bigint, nullable) — When consultation started (epoch ms).
   - `attendance_end_at` (bigint, nullable) — When consultation ended (epoch ms).
   - `reschedule_count` (integer) — How many times this appointment was rescheduled.
   - `created_at` (timestamptz) — Record creation timestamp.

3. `sede_config` — Singleton configuration row for the medical sede.
   - `id` (integer, primary key) — Always 1 (singleton).
   - `name` (text) — Sede / clinic name.
   - `address` (text) — Physical address.
   - `lat` (double precision) — GPS latitude.
   - `lng` (double precision) — GPS longitude.
   - `consultation_minutes` (integer) — Average minutes per consultation.
   - `geofence_radius` (integer) — Check-in radius in meters.
   - `updated_at` (timestamptz) — Last modification timestamp.

4. `queue_state` — Singleton holding global queue runtime state.
   - `id` (integer, primary key) — Always 1 (singleton).
   - `next_ticket_number` (integer) — Next ticket number to assign.
   - `current_called_id` (uuid, nullable) — Appointment ID currently being called.
   - `countdown_ends_at` (bigint, nullable) — When the 3-minute countdown ends (epoch ms).
   - `attended_count` (integer) — Total patients attended today.
   - `total_consultation_minutes` (integer) — Sum of consultation durations for averaging.
   - `updated_at` (timestamptz) — Last modification timestamp.

## Security
- RLS enabled on all tables.
- Policies grant full CRUD to `anon, authenticated` because the app uses its own
  cedula-based login (not Supabase Auth) and all queue data is intentionally shared
  across all users (doctors, patients, admins see the same queue).

## Seed Data
- 6 users (1 doctor, 4 patients, 1 admin) matching the mock data.
- 4 appointments in 'checked-in' status with GPS distances.
- 1 sede_config row with the Batallón de Infantería N.5 coordinates.
- 1 queue_state row with initial runtime state.

## Important Notes
1. The app uses cedula-based authentication, NOT Supabase Auth. The `anon` role
   must have full CRUD access for the frontend to function.
2. `sede_config` and `queue_state` are singletons — always id = 1.
3. Timestamps for appointment events use bigint (epoch milliseconds) to match
   the frontend's Date.now() format.
*/

-- ============================================================
-- 1. users table
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  cedula text PRIMARY KEY,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('doctor', 'patient', 'admin')),
  sede_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 2. appointments table
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_cedula text NOT NULL REFERENCES users(cedula) ON DELETE CASCADE,
  patient_name text NOT NULL,
  scheduled_time text NOT NULL DEFAULT '--:--',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked-in', 'called', 'in-attendance', 'attended', 'absent', 'rescheduled')),
  ticket_number integer NOT NULL,
  check_in_time bigint,
  called_at bigint,
  gps_distance integer,
  attendance_start_at bigint,
  attendance_end_at bigint,
  reschedule_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_appointments" ON appointments;
CREATE POLICY "anon_select_appointments" ON appointments FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_appointments" ON appointments;
CREATE POLICY "anon_insert_appointments" ON appointments FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_appointments" ON appointments;
CREATE POLICY "anon_update_appointments" ON appointments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_appointments" ON appointments;
CREATE POLICY "anon_delete_appointments" ON appointments FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_cedula ON appointments(patient_cedula);
CREATE INDEX IF NOT EXISTS idx_appointments_ticket_number ON appointments(ticket_number);

-- ============================================================
-- 3. sede_config table (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS sede_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL,
  address text NOT NULL,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  consultation_minutes integer NOT NULL DEFAULT 15,
  geofence_radius integer NOT NULL DEFAULT 200,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sede_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sede_config" ON sede_config;
CREATE POLICY "anon_select_sede_config" ON sede_config FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sede_config" ON sede_config;
CREATE POLICY "anon_insert_sede_config" ON sede_config FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sede_config" ON sede_config;
CREATE POLICY "anon_update_sede_config" ON sede_config FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sede_config" ON sede_config;
CREATE POLICY "anon_delete_sede_config" ON sede_config FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 4. queue_state table (singleton)
-- ============================================================
CREATE TABLE IF NOT EXISTS queue_state (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  next_ticket_number integer NOT NULL DEFAULT 1,
  current_called_id uuid,
  countdown_ends_at bigint,
  attended_count integer NOT NULL DEFAULT 0,
  total_consultation_minutes integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE queue_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_queue_state" ON queue_state;
CREATE POLICY "anon_select_queue_state" ON queue_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_queue_state" ON queue_state;
CREATE POLICY "anon_insert_queue_state" ON queue_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_queue_state" ON queue_state;
CREATE POLICY "anon_update_queue_state" ON queue_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_queue_state" ON queue_state;
CREATE POLICY "anon_delete_queue_state" ON queue_state FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- 5. Seed data
-- ============================================================

-- Users
INSERT INTO users (cedula, name, role, sede_name) VALUES
  ('12345678', 'Dr. Mario', 'doctor', 'Batallón de Infantería N.5 Córdova - Santa Marta'),
  ('87654321', 'Paciente Juan', 'patient', NULL),
  ('99999999', 'Admin Global', 'admin', NULL),
  ('11223344', 'Paciente María', 'patient', NULL),
  ('55667788', 'Paciente Carlos', 'patient', NULL),
  ('99887766', 'Paciente Ana', 'patient', NULL)
ON CONFLICT (cedula) DO NOTHING;

-- Sede config (singleton)
INSERT INTO sede_config (id, name, address, lat, lng, consultation_minutes, geofence_radius) VALUES
  (1, 'Batallón de Infantería N.5 Córdova - Santa Marta', 'Calle 24 # 7-100 / Av. Ferrocarril, Santa Marta, Magdalena', 11.2358, -74.2083, 15, 200)
ON CONFLICT (id) DO NOTHING;

-- Queue state (singleton)
INSERT INTO queue_state (id, next_ticket_number, current_called_id, countdown_ends_at, attended_count, total_consultation_minutes) VALUES
  (1, 5, NULL, NULL, 6, 90)
ON CONFLICT (id) DO NOTHING;

-- Appointments (use EXTRACT(epoch) for millisecond timestamps)
INSERT INTO appointments (id, patient_cedula, patient_name, scheduled_time, status, ticket_number, check_in_time, gps_distance, reschedule_count)
SELECT
  gen_random_uuid(),
  p.cedula,
  p.name,
  t.scheduled_time,
  'checked-in',
  t.ticket_number,
  (EXTRACT(epoch FROM now()) * 1000)::bigint - t.minutes_ago * 60000,
  t.gps_distance,
  0
FROM (VALUES
  ('87654321', '08:00', 1, 30, 85),
  ('11223344', '08:30', 2, 20, 120),
  ('55667788', '09:00', 3, 12, 45),
  ('99887766', '09:30', 4, 5, 175)
) AS t(cedula, scheduled_time, ticket_number, minutes_ago, gps_distance)
JOIN users p ON p.cedula = t.cedula
WHERE NOT EXISTS (
  SELECT 1 FROM appointments a
  WHERE a.patient_cedula = t.cedula
    AND a.status IN ('scheduled', 'checked-in', 'called', 'in-attendance', 'rescheduled')
);
