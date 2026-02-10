-- Script de creación de tablas para el nuevo proyecto MISAPP (todas con sufijo GPV)

CREATE TABLE IF NOT EXISTS distributorsGPV (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  taxid text NOT NULL,
  stage text NOT NULL,
  channelcode text,
  contact jsonb,
  city text,
  island text,
  province text,
  category jsonb,
  categoryid text,
  pendingdata boolean,
  brandpolicy jsonb,
  priority text NOT NULL,
  score numeric,
  notes text,
  noteshistory jsonb,
  createdat timestamptz NOT NULL,
  updatedat timestamptz,
  lastcontactat timestamptz,
  position integer,
  source text
);

CREATE TABLE IF NOT EXISTS candidatesGPV (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  externalcode text,
  category jsonb NOT NULL,
  categoryid text NOT NULL,
  pendingdata boolean NOT NULL,
  brandpolicy jsonb NOT NULL,
  name text NOT NULL,
  contactperson text NOT NULL,
  contactpersonbackup text NOT NULL,
  channeltype text NOT NULL,
  brands text[] NOT NULL,
  status text NOT NULL,
  province text NOT NULL,
  city text NOT NULL,
  postalcode text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  address text,
  createdat timestamptz NOT NULL,
  notes text NOT NULL,
  noteshistory jsonb,
  taxid text NOT NULL,
  fiscalname text NOT NULL,
  fiscaladdress text NOT NULL,
  upgraderequested boolean NOT NULL,
  teamid text,
  checklist jsonb NOT NULL,
  checklistcomplete boolean NOT NULL,
  completion numeric NOT NULL,
  salesytd numeric NOT NULL,
  priorityscore numeric NOT NULL,
  prioritylevel text NOT NULL,
  prioritydrivers jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS salesGPV (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributorid uuid,
  date timestamptz NOT NULL,
  brand text NOT NULL,
  family text NOT NULL,
  operations integer NOT NULL,
  notes text NOT NULL,
  createdat timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS visitsGPV (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  distributorid uuid,
  candidateid uuid,
  date timestamptz NOT NULL,
  type text NOT NULL,
  objective text NOT NULL,
  summary text NOT NULL,
  nextsteps text NOT NULL,
  result text NOT NULL,
  durationminutes integer NOT NULL,
  createdat timestamptz NOT NULL,
  reminder jsonb NOT NULL,
  notes text,
  noteshistory jsonb
);

CREATE TABLE IF NOT EXISTS sectorsGPV (
  id text PRIMARY KEY,
  label text NOT NULL,
  icon text,
  color text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brandsGPV (
  id text PRIMARY KEY,
  label text NOT NULL,
  sector_id text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_profilesGPV (
  id uuid PRIMARY KEY,
  full_name text,
  role text DEFAULT 'commercial',
  zone text DEFAULT 'todas',
  permissions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
