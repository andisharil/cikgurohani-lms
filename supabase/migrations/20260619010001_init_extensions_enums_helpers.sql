-- cikgurohani LMS — foundation: extensions, enums, helper functions
-- All enum labels use the exact Malay values from the PRD so generated TS
-- types match the domain language used across the app.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type tingkatan as enum ('T4', 'T5', 'T4&5');
create type target_tingkatan as enum ('T4', 'T5', 'Kedua-dua');
create type pakej as enum ('Bulanan', '3 Bulan', '6 Bulan');
create type saluran_bayaran as enum ('BCL', 'BayarCash', 'Manual', 'Pindahan Bank');

create type payment_status as enum ('Berjaya', 'Menunggu', 'Ditolak', 'Refunded');
create type renewal_status as enum ('Menunggu', 'Diluluskan', 'Ditolak');
create type renewal_sumber as enum ('Portal', 'BayarCash', 'Manual');
create type request_status as enum ('Baharu', 'Selesai', 'Ditolak');
create type refund_kaedah as enum ('Akaun bank', 'QR DuitNow');
create type refund_status as enum ('Dimohon', 'Selesai');

create type notif_channel as enum ('Portal', 'Email', 'WhatsApp');
create type notif_status as enum ('Berjaya', 'Gagal', 'Menunggu');

create type admin_role as enum ('Pemilik', 'Pembantu', 'Finance');
create type announcement_audience as enum ('Semua', 'T4', 'T5');
create type announcement_cta as enum ('zoom', 'bahan', 'rakaman', 'bank');
create type comment_author as enum ('parent', 'student', 'admin');

create type waba_template_category as enum ('Utility', 'Marketing', 'Authentication');
create type waba_template_status as enum ('Draft', 'Pending', 'Approved', 'Rejected');
create type waba_msg_direction as enum ('in', 'out');
create type waba_device_status as enum ('connected', 'disconnected');
create type waba_blast_status as enum ('Scheduled', 'Sending', 'Completed', 'Failed');

-- subscription status is DERIVED, not stored (see student_status()).
create type subscription_status as enum ('Aktif', 'Akan Tamat', 'Tamat', 'Disekat');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

-- Keep updated_at fresh on UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Derived subscription status from aktif + tarikh_tamat (PRD §4.1).
--   aktif=false                      -> Disekat
--   expired (tarikh_tamat < today)   -> Tamat
--   <= 7 days left                   -> Akan Tamat
--   otherwise                        -> Aktif
create or replace function student_status(p_aktif boolean, p_tarikh_tamat date)
returns subscription_status
language sql
immutable
as $$
  select case
    when p_aktif is not true then 'Disekat'::subscription_status
    when p_tarikh_tamat is null then 'Tamat'::subscription_status
    when p_tarikh_tamat < current_date then 'Tamat'::subscription_status
    when p_tarikh_tamat - current_date <= 7 then 'Akan Tamat'::subscription_status
    else 'Aktif'::subscription_status
  end;
$$;

-- Package price by tingkatan + pakej (PRD §4.2). Returns RM amount.
create or replace function package_price(p_tingkatan tingkatan, p_pakej pakej)
returns numeric
language sql
immutable
as $$
  select case
    when p_tingkatan = 'T4&5' then
      case p_pakej when 'Bulanan' then 160 when '3 Bulan' then 460 when '6 Bulan' then 900 end
    else
      case p_pakej when 'Bulanan' then 80 when '3 Bulan' then 230 when '6 Bulan' then 450 end
  end::numeric;
$$;

-- Package duration in months.
create or replace function package_months(p_pakej pakej)
returns integer
language sql
immutable
as $$
  select case p_pakej when 'Bulanan' then 1 when '3 Bulan' then 3 when '6 Bulan' then 6 end;
$$;

-- New expiry given a start date + package (PRD §4.2 duration component).
create or replace function calc_expiry(p_start date, p_pakej pakej)
returns date
language sql
immutable
as $$
  select (p_start + (package_months(p_pakej) || ' months')::interval)::date;
$$;
