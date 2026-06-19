-- cikgurohani LMS — admin users, permissions, settings, WABA, student OTP

-- Admin users mirror auth.users with a role + active flag (PRD §3.1, §15)
create table admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  nama text not null,
  emel text,
  role admin_role not null default 'Pembantu',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger admin_users_set_updated_at before update on admin_users
  for each row execute function set_updated_at();

-- Configurable permission matrix per role (PRD §15). One row per (role, key).
create table role_permissions (
  role admin_role not null,
  permission text not null,
  allowed boolean not null default false,
  primary key (role, permission)
);

-- Singleton-ish key/value settings (community link, default language, ...)
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger app_settings_set_updated_at before update on app_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- WABA / WhatsApp (PRD §13)
-- ---------------------------------------------------------------------------
create table waba_devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone_number text,
  status waba_device_status not null default 'disconnected',
  quality_rating text,
  daily_quota integer,
  created_at timestamptz not null default now()
);

create table waba_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category waba_template_category not null default 'Utility',
  language text not null default 'ms',
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  status waba_template_status not null default 'Draft',
  rejection_note text,
  meta_template_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger waba_templates_set_updated_at before update on waba_templates
  for each row execute function set_updated_at();

-- Inbox messages, threaded by parent
create table waba_messages (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  direction waba_msg_direction not null,
  body text,
  template_id uuid references waba_templates(id) on delete set null,
  wa_message_id text,
  status text,
  baca boolean not null default false,
  created_at timestamptz not null default now()
);
create index waba_messages_parent_idx on waba_messages(parent_id);
create index waba_messages_created_at_idx on waba_messages(created_at);

create table waba_blasts (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references waba_templates(id) on delete set null,
  audience text not null,
  schedule_at timestamptz,
  status waba_blast_status not null default 'Scheduled',
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Student WhatsApp OTP (custom issue/verify; delivery via Meta Cloud API).
-- code_hash stores a hash of the code, never the plaintext.
create table student_otps (
  id uuid primary key default gen_random_uuid(),
  telefon text not null,
  code_hash text not null,
  student_id uuid references students(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);
create index student_otps_telefon_idx on student_otps(telefon);
create index student_otps_expires_at_idx on student_otps(expires_at);
