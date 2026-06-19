-- cikgurohani LMS — security hardening from Supabase advisors
--
-- 1) Pin search_path on plain functions (prevents search_path hijacking).
-- 2) Restrict the SECURITY DEFINER helper functions: anon/public should not be
--    able to call them via PostgREST RPC. `authenticated` keeps EXECUTE because
--    parent RLS policies evaluate these functions. service_role keeps it too.
--
-- Note: student_otps intentionally has RLS enabled with NO policy (deny-all to
-- client roles); only service_role (trusted server code) reads/writes it.

alter function set_updated_at() set search_path = public;
alter function student_status(boolean, date) set search_path = public;
alter function package_price(tingkatan, pakej) set search_path = public;
alter function package_months(pakej) set search_path = public;
alter function calc_expiry(date, pakej) set search_path = public;

revoke execute on function is_admin() from anon, public;
revoke execute on function current_admin_role() from anon, public;
revoke execute on function is_owner() from anon, public;
revoke execute on function has_permission(text) from anon, public;
revoke execute on function current_parent_id() from anon, public;

grant execute on function is_admin() to authenticated, service_role;
grant execute on function current_admin_role() to authenticated, service_role;
grant execute on function is_owner() to authenticated, service_role;
grant execute on function has_permission(text) to authenticated, service_role;
grant execute on function current_parent_id() to authenticated, service_role;
