-- cikgurohani LMS — auth/permission helper functions + status view
-- These functions are SECURITY DEFINER so they can read admin_users /
-- role_permissions / parents without tripping the RLS policies that themselves
-- call these functions (avoids infinite recursion). search_path is pinned.

create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from admin_users
    where id = auth.uid() and active = true
  );
$$;

create or replace function current_admin_role()
returns admin_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select role from admin_users
  where id = auth.uid() and active = true;
$$;

create or replace function is_owner()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select current_admin_role() = 'Pemilik';
$$;

-- Permission check: Owner always allowed; otherwise look up the matrix.
create or replace function has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when not is_admin() then false
    when current_admin_role() = 'Pemilik' then true
    else coalesce(
      (select allowed from role_permissions
        where role = current_admin_role() and permission = perm),
      false)
  end;
$$;

-- The parent record linked to the currently signed-in auth user (portal).
create or replace function current_parent_id()
returns uuid
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select id from parents where auth_user_id = auth.uid();
$$;

-- Students with derived subscription status + days_left, RLS-respecting.
create view students_with_status
with (security_invoker = on)
as
  select
    s.*,
    student_status(s.aktif, s.tarikh_tamat) as status,
    case when s.tarikh_tamat is null then null
         else (s.tarikh_tamat - current_date) end as days_left
  from students s;
