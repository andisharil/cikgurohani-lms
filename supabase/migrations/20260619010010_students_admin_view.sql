-- cikgurohani LMS — admin list view: student + derived status + parent info,
-- so the Student List can search/filter/sort/paginate server-side (PRD §7.2).
-- security_invoker = on => underlying RLS applies (admins see all via admin_all).

create view students_admin
with (security_invoker = on)
as
  select
    s.id,
    s.code,
    s.parent_id,
    s.nama,
    s.telefon,
    s.tingkatan,
    s.pakej,
    s.tarikh_mula,
    s.tarikh_tamat,
    s.saluran_bayaran,
    s.aktif,
    s.created_at,
    student_status(s.aktif, s.tarikh_tamat) as status,
    case when s.tarikh_tamat is null then null
         else (s.tarikh_tamat - current_date) end as days_left,
    p.nama as parent_nama,
    p.emel as parent_emel,
    p.code as parent_code,
    p.telefon as parent_telefon
  from students s
  join parents p on p.id = s.parent_id;
