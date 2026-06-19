-- cikgurohani LMS — Row Level Security
--
-- Access model:
--   * service_role (server: webhooks, cron, student portal, content gating)
--     bypasses RLS entirely — scoping is enforced in trusted server code.
--   * admins  -> gated by is_admin() (+ permission checks in app/server layer).
--   * parents -> Supabase-authed; RLS scopes them to their OWN private rows.
--   * students -> never connect directly (server-side via service_role after
--     OTP verify), so no student-facing policies are needed.
--   * anon -> no policies => no access.
--
-- Content tables (materials/recordings/bank_soalan/announcements/reports/zoom)
-- are admin-only at the RLS layer; portal content is delivered by server code
-- that applies the package/status/tingkatan gating, so parents can't bypass
-- gating with direct client queries.

-- Enable RLS everywhere.
alter table parents enable row level security;
alter table students enable row level security;
alter table payments enable row level security;
alter table renewal_requests enable row level security;
alter table package_change_requests enable row level security;
alter table profile_change_requests enable row level security;
alter table refunds enable row level security;
alter table materials enable row level security;
alter table recordings enable row level security;
alter table bank_soalan_folders enable row level security;
alter table bank_soalan_files enable row level security;
alter table announcements enable row level security;
alter table announcement_comments enable row level security;
alter table student_reports enable row level security;
alter table zoom_links enable row level security;
alter table notifications enable row level security;
alter table activity_logs enable row level security;
alter table admin_users enable row level security;
alter table role_permissions enable row level security;
alter table app_settings enable row level security;
alter table waba_devices enable row level security;
alter table waba_templates enable row level security;
alter table waba_messages enable row level security;
alter table waba_blasts enable row level security;
alter table student_otps enable row level security;

-- ---------------------------------------------------------------------------
-- Admin full-access policies (coarse gate; module permissions enforced in app)
-- ---------------------------------------------------------------------------
create policy admin_all on parents for all using (is_admin()) with check (is_admin());
create policy admin_all on students for all using (is_admin()) with check (is_admin());
create policy admin_all on payments for all using (is_admin()) with check (is_admin());
create policy admin_all on renewal_requests for all using (is_admin()) with check (is_admin());
create policy admin_all on package_change_requests for all using (is_admin()) with check (is_admin());
create policy admin_all on profile_change_requests for all using (is_admin()) with check (is_admin());
create policy admin_all on refunds for all using (is_admin()) with check (is_admin());
create policy admin_all on materials for all using (is_admin()) with check (is_admin());
create policy admin_all on recordings for all using (is_admin()) with check (is_admin());
create policy admin_all on bank_soalan_folders for all using (is_admin()) with check (is_admin());
create policy admin_all on bank_soalan_files for all using (is_admin()) with check (is_admin());
create policy admin_all on announcements for all using (is_admin()) with check (is_admin());
create policy admin_all on announcement_comments for all using (is_admin()) with check (is_admin());
create policy admin_all on student_reports for all using (is_admin()) with check (is_admin());
create policy admin_all on zoom_links for all using (is_admin()) with check (is_admin());
create policy admin_all on notifications for all using (is_admin()) with check (is_admin());
create policy admin_all on activity_logs for all using (is_admin()) with check (is_admin());
create policy admin_all on waba_devices for all using (is_admin()) with check (is_admin());
create policy admin_all on waba_templates for all using (is_admin()) with check (is_admin());
create policy admin_all on waba_messages for all using (is_admin()) with check (is_admin());
create policy admin_all on waba_blasts for all using (is_admin()) with check (is_admin());

-- Settings / users / permissions — read for admins, write gated to owner or
-- explicit permission.
create policy admin_read on admin_users for select using (is_admin());
create policy owner_write on admin_users for all
  using (is_owner() or has_permission('permission'))
  with check (is_owner() or has_permission('permission'));

create policy admin_read on role_permissions for select using (is_admin());
create policy owner_write on role_permissions for all
  using (is_owner() or has_permission('permission'))
  with check (is_owner() or has_permission('permission'));

create policy admin_read on app_settings for select using (is_admin());
create policy owner_write on app_settings for all
  using (is_owner() or has_permission('tetapan'))
  with check (is_owner() or has_permission('tetapan'));

-- student_otps: no client policies at all => only service_role can touch it.

-- ---------------------------------------------------------------------------
-- Parent (portal) scoped policies — own private data only
-- ---------------------------------------------------------------------------
create policy parent_own on parents for select using (id = current_parent_id());
create policy parent_own on students for select using (parent_id = current_parent_id());
create policy parent_own on payments for select using (parent_id = current_parent_id());
create policy parent_own on refunds for select using (parent_id = current_parent_id());

create policy parent_read on renewal_requests for select using (parent_id = current_parent_id());
create policy parent_insert on renewal_requests for insert with check (parent_id = current_parent_id());

create policy parent_read on package_change_requests for select using (parent_id = current_parent_id());
create policy parent_insert on package_change_requests for insert with check (parent_id = current_parent_id());

create policy parent_read on profile_change_requests for select using (parent_id = current_parent_id());
create policy parent_insert on profile_change_requests for insert with check (parent_id = current_parent_id());

-- Parents see their own portal notifications and may mark them read.
create policy parent_read on notifications for select using (parent_id = current_parent_id());
create policy parent_update on notifications for update
  using (parent_id = current_parent_id())
  with check (parent_id = current_parent_id());
