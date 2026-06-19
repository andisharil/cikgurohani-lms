-- cikgurohani LMS — schedule the daily reminder job via pg_cron.
-- Runs 01:00 UTC (~09:00 MYT) daily. Idempotent: unschedules first if present.

create extension if not exists pg_cron;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'daily-reminders') then
    perform cron.unschedule('daily-reminders');
  end if;
end $$;

select cron.schedule('daily-reminders', '0 1 * * *', $$select public.run_daily_reminders();$$);
