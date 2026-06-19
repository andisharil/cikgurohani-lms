-- cikgurohani LMS — core entities
-- Design note: UUID primary keys everywhere; human-readable codes (PAR-00001,
-- STU-00001, ...) are a separate unique column generated from a sequence.
-- Foreign keys reference the UUIDs, so renaming a "Parent ID"/"Student ID" is
-- just relabeling — related records stay linked automatically (the PRD's
-- "migrate all related records" concern becomes a non-issue). The admin-facing
-- guard (block code change while a request is pending) is enforced in app code.

create sequence parent_code_seq;
create sequence student_code_seq;
create sequence payment_code_seq;
create sequence renewal_code_seq;
create sequence pkgreq_code_seq;
create sequence prfreq_code_seq;
create sequence refund_code_seq;

-- ---------------------------------------------------------------------------
-- Parents
-- ---------------------------------------------------------------------------
create table parents (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('PAR-' || lpad(nextval('parent_code_seq')::text, 5, '0')),
  nama text not null,
  emel text,
  telefon text,
  lokasi text,
  tarikh_daftar date not null default current_date,
  duplicate_parent_id uuid references parents(id) on delete set null,
  username_display text,
  marketing_opt_in boolean not null default false,
  auth_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index parents_auth_user_id_idx on parents(auth_user_id);
create index parents_telefon_idx on parents(telefon);
create trigger parents_set_updated_at before update on parents
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
create table students (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('STU-' || lpad(nextval('student_code_seq')::text, 5, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  nama text not null,
  telefon text,
  tingkatan tingkatan not null,
  pakej pakej not null,
  tarikh_mula date,
  tarikh_tamat date,
  saluran_bayaran saluran_bayaran,
  aktif boolean not null default true,
  block_reason text,             -- internal only; never exposed to parent (PRD §4.4.7)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index students_parent_id_idx on students(parent_id);
create index students_telefon_idx on students(telefon);
create index students_tingkatan_idx on students(tingkatan);
create index students_tarikh_tamat_idx on students(tarikh_tamat);
create trigger students_set_updated_at before update on students
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Payments / Transactions
-- ---------------------------------------------------------------------------
create table payments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('PAY-' || lpad(nextval('payment_code_seq')::text, 5, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  tarikh date not null default current_date,
  pakej pakej,
  jumlah numeric(10, 2) not null,
  saluran saluran_bayaran,
  ref text,                       -- bank/gateway reference
  resit_url text,
  refunded_by_refund_id uuid,     -- FK added after refunds table exists
  status payment_status not null default 'Berjaya',
  created_at timestamptz not null default now()
);
create index payments_parent_id_idx on payments(parent_id);
create index payments_student_id_idx on payments(student_id);
create index payments_status_idx on payments(status);
create index payments_tarikh_idx on payments(tarikh);

-- ---------------------------------------------------------------------------
-- Renewal Requests
-- ---------------------------------------------------------------------------
create table renewal_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('RNW-' || lpad(nextval('renewal_code_seq')::text, 4, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  pakej pakej not null,
  jumlah numeric(10, 2) not null,
  resit_url text,
  status renewal_status not null default 'Menunggu',
  sumber renewal_sumber not null default 'Manual',
  sebab_tolak text,
  lulus_oleh uuid references auth.users(id) on delete set null,
  lulus_masa timestamptz,
  created_at timestamptz not null default now()
);
create index renewal_requests_student_id_idx on renewal_requests(student_id);
create index renewal_requests_status_idx on renewal_requests(status);

-- ---------------------------------------------------------------------------
-- Package Change Requests
-- ---------------------------------------------------------------------------
create table package_change_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('REQ-' || lpad(nextval('pkgreq_code_seq')::text, 4, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  dari_pakej pakej not null,
  ke_pakej pakej not null,
  status request_status not null default 'Baharu',
  created_at timestamptz not null default now()
);
create index package_change_requests_status_idx on package_change_requests(status);

-- ---------------------------------------------------------------------------
-- Profile Change Requests (sensitive; student phone = login key, PRD §10.4)
-- ---------------------------------------------------------------------------
create table profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('PRF-' || lpad(nextval('prfreq_code_seq')::text, 4, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  field text not null,
  old_value text,
  new_value text,
  status request_status not null default 'Baharu',
  requested_by text,              -- 'parent' | 'student' | admin user id
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index profile_change_requests_status_idx on profile_change_requests(status);

-- ---------------------------------------------------------------------------
-- Refunds
-- ---------------------------------------------------------------------------
create table refunds (
  id uuid primary key default gen_random_uuid(),
  code text unique not null default ('RFD-' || lpad(nextval('refund_code_seq')::text, 4, '0')),
  parent_id uuid not null references parents(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  payment_id uuid references payments(id) on delete set null,
  jumlah numeric(10, 2) not null,
  sebab text,
  kaedah refund_kaedah not null,
  akaun text,                     -- bank account no (when kaedah = 'Akaun bank')
  qr_url text,                    -- uploaded QR (when kaedah = 'QR DuitNow')
  status refund_status not null default 'Dimohon',
  requested_by uuid references auth.users(id) on delete set null,
  processed_by uuid references auth.users(id) on delete set null,
  resit_refund_url text,
  notified boolean not null default false,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create index refunds_parent_id_idx on refunds(parent_id);
create index refunds_status_idx on refunds(status);
create index refunds_payment_id_idx on refunds(payment_id);

-- Now that refunds exists, complete the payments <-> refunds link.
alter table payments
  add constraint payments_refunded_by_refund_id_fkey
  foreign key (refunded_by_refund_id) references refunds(id) on delete set null;
