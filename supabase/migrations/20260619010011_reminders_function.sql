-- cikgurohani LMS — daily reminder generator (PRD §16.7).
-- Inserts Portal notifications for students at 7 days / 3 days before expiry,
-- on expiry day, and 3 days after expiry. Deduped per student+type+day so it's
-- safe to run repeatedly. WhatsApp/email dispatch of these can be layered on by
-- a worker that reads recent reminder notifications.

create or replace function run_daily_reminders()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer := 0;
  r record;
begin
  for r in
    select s.id, s.code, s.parent_id, s.tarikh_tamat,
      case
        when s.tarikh_tamat = current_date + 7 then 'reminder_7d'
        when s.tarikh_tamat = current_date + 3 then 'reminder_3d'
        when s.tarikh_tamat = current_date then 'akses_tamat'
        when s.tarikh_tamat = current_date - 3 then 'selepas_tamat'
      end as rtype
    from students s
    where s.aktif
      and s.tarikh_tamat in (current_date + 7, current_date + 3, current_date, current_date - 3)
  loop
    if not exists (
      select 1 from notifications n
      where n.student_id = r.id and n.type = r.rtype and n.created_at::date = current_date
    ) then
      insert into notifications (parent_id, student_id, channel, type, message, status)
      values (
        r.parent_id, r.id, 'Portal', r.rtype,
        case r.rtype
          when 'reminder_7d' then 'Langganan ' || r.code || ' akan tamat dalam 7 hari.'
          when 'reminder_3d' then 'Langganan ' || r.code || ' akan tamat dalam 3 hari.'
          when 'akses_tamat' then 'Langganan ' || r.code || ' tamat hari ini. Sila perbaharui.'
          else 'Langganan ' || r.code || ' telah tamat 3 hari lalu. Sila perbaharui.'
        end,
        'Berjaya'
      );
      inserted := inserted + 1;
    end if;
  end loop;
  return inserted;
end;
$$;

-- Only the cron job (DB owner) should run this — not API roles.
revoke execute on function run_daily_reminders() from anon, public, authenticated;
