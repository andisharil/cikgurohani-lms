-- cikgurohani LMS — notifications (PRD §12) + activity logs (audit, §19)

create table notifications (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  channel notif_channel not null,
  type text not null,            -- e.g. 'reminder_7d', 'renewal', 'refund', ...
  message text,
  status notif_status not null default 'Menunggu',
  baca boolean not null default false,   -- for Portal notifications
  provider_response jsonb,       -- raw provider payload/error for debugging + retry history
  created_at timestamptz not null default now()
);
create index notifications_parent_id_idx on notifications(parent_id);
create index notifications_status_idx on notifications(status);
create index notifications_channel_idx on notifications(channel);
create index notifications_created_at_idx on notifications(created_at);

-- Activity log: append-only audit trail. internal_note + actor are admin-only.
create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references parents(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  type text not null,            -- 'log_masuk' | 'pakej' | 'notifikasi' | 'edit' | 'refund' | ...
  message text not null,
  actor uuid references auth.users(id) on delete set null,
  actor_label text,              -- denormalized actor name/role for display
  internal_note text,            -- never exposed to parent/student
  created_at timestamptz not null default now()
);
create index activity_logs_parent_id_idx on activity_logs(parent_id);
create index activity_logs_student_id_idx on activity_logs(student_id);
create index activity_logs_created_at_idx on activity_logs(created_at);
