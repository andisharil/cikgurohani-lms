-- cikgurohani LMS — content management (PRD §8)
-- Separate tables per content type since access rules differ per type.

-- Bahan Kelas (class materials)
create table materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  file_url text,
  file_size bigint,
  mime_type text,
  target target_tingkatan not null default 'Kedua-dua',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger materials_set_updated_at before update on materials
  for each row execute function set_updated_at();

-- Rakaman (recordings) — external URLs (e.g. YouTube)
create table recordings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  target target_tingkatan not null default 'Kedua-dua',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger recordings_set_updated_at before update on recordings
  for each row execute function set_updated_at();

-- Bank Soalan — folder tree (T4/T5 only at top; access gated to 3/6-month pkgs)
create table bank_soalan_folders (
  id uuid primary key default gen_random_uuid(),
  parent_folder_id uuid references bank_soalan_folders(id) on delete cascade,
  tingkatan tingkatan not null,   -- 'T4' | 'T5' (root grouping)
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index bank_soalan_folders_parent_idx on bank_soalan_folders(parent_folder_id);

create table bank_soalan_files (
  id uuid primary key default gen_random_uuid(),
  folder_id uuid not null references bank_soalan_folders(id) on delete cascade,
  title text not null,
  file_url text,
  file_size bigint,
  mime_type text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index bank_soalan_files_folder_idx on bank_soalan_files(folder_id);

-- Pengumuman (announcements) + threaded comments
create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  audience announcement_audience not null default 'Semua',
  cta_type announcement_cta,
  published boolean not null default true,   -- false = draft (auto-created from upload)
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_audience_idx on announcements(audience);
create trigger announcements_set_updated_at before update on announcements
  for each row execute function set_updated_at();

create table announcement_comments (
  id uuid primary key default gen_random_uuid(),
  announcement_id uuid not null references announcements(id) on delete cascade,
  parent_comment_id uuid references announcement_comments(id) on delete cascade,
  author_type comment_author not null,
  author_id uuid,                 -- parent.id / student.id / auth.users.id depending on author_type
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
create index announcement_comments_announcement_idx on announcement_comments(announcement_id);

-- Laporan Pelajar (monthly student reports, by tingkatan)
create table student_reports (
  id uuid primary key default gen_random_uuid(),
  tingkatan tingkatan not null,   -- 'T4' | 'T5'
  bulan text not null,
  ringkasan text,
  guru text,
  tarikh_publish date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index student_reports_tingkatan_idx on student_reports(tingkatan);

-- Zoom Links — one row per tingkatan (T4, T5)
create table zoom_links (
  tingkatan tingkatan primary key,   -- 'T4' | 'T5'
  url text,
  updated_at timestamptz not null default now()
);
create trigger zoom_links_set_updated_at before update on zoom_links
  for each row execute function set_updated_at();
