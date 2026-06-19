-- Demo / dev seed data (idempotent-ish: safe to run once on a fresh DB).
-- Applied to the dev project on 2026-06-19. Dates are relative to today so
-- the four subscription statuses are all exercised.

insert into parents (nama, emel, telefon, lokasi, marketing_opt_in) values
 ('Ahmad bin Ali','ahmad@example.com','0123456789','Kuala Lumpur', true),
 ('Siti binti Hassan','siti@example.com','0198765432','Johor Bahru', false),
 ('Lim Wei Chong','lim@example.com','0112223333','Pulau Pinang', true);

insert into students (parent_id,nama,telefon,tingkatan,pakej,tarikh_mula,tarikh_tamat,saluran_bayaran,aktif)
select id,'Aiman Ahmad','0123456701','T4','6 Bulan',current_date-30,current_date+150,'BayarCash',true from parents where emel='ahmad@example.com';
insert into students (parent_id,nama,telefon,tingkatan,pakej,tarikh_mula,tarikh_tamat,saluran_bayaran,aktif)
select id,'Nurul Ahmad','0123456702','T5','Bulanan',current_date-25,current_date+5,'BayarCash',true from parents where emel='ahmad@example.com';
insert into students (parent_id,nama,telefon,tingkatan,pakej,tarikh_mula,tarikh_tamat,saluran_bayaran,aktif)
select id,'Faris Hassan','0123456703','T4&5','3 Bulan',current_date-100,current_date-10,'Manual',true from parents where emel='siti@example.com';
insert into students (parent_id,nama,telefon,tingkatan,pakej,tarikh_mula,tarikh_tamat,saluran_bayaran,aktif)
select id,'Hana Hassan','0123456704','T5','Bulanan',current_date-20,current_date+20,'BayarCash',true from parents where emel='siti@example.com';
insert into students (parent_id,nama,telefon,tingkatan,pakej,tarikh_mula,tarikh_tamat,saluran_bayaran,aktif)
select id,'Jia Lim','0123456705','T4','3 Bulan',current_date-40,current_date+50,'Pindahan Bank',false from parents where emel='lim@example.com';

insert into payments (parent_id, student_id, tarikh, pakej, jumlah, saluran, status)
select s.parent_id, s.id, s.tarikh_mula, s.pakej, package_price(s.tingkatan, s.pakej), s.saluran_bayaran, 'Berjaya'
from students s
where s.nama in ('Aiman Ahmad','Nurul Ahmad','Faris Hassan','Hana Hassan','Jia Lim');

insert into renewal_requests (parent_id, student_id, pakej, jumlah, status, sumber)
select s.parent_id, s.id, '3 Bulan', package_price(s.tingkatan,'3 Bulan'), 'Menunggu', 'Portal'
from students s where s.nama = 'Faris Hassan';

insert into announcements (title, body, audience) values
 ('Selamat datang ke cikgurohani','Sesi kelas T4 & T5 bermula minggu ini. Semak jadual Zoom anda.','Semua');

-- Demo content for the portals.
insert into materials (title, target, file_url) values
 ('Nota Ringkas Bab 1 (T5)', 'T5', 'https://example.com/nota-t5-bab1.pdf'),
 ('Formula Penting (Semua)', 'Kedua-dua', 'https://example.com/formula.pdf');

insert into recordings (title, url, target) values
 ('Rakaman Kelas: Pengenalan', 'https://youtube.com/watch?v=demo1', 'Kedua-dua'),
 ('Rakaman Khas T4', 'https://youtube.com/watch?v=demo2', 'T4');

insert into student_reports (tingkatan, bulan, ringkasan, guru) values
 ('T5', 'Jun 2026', 'Prestasi keseluruhan baik. Fokus pada bab ulangkaji.', 'Cikgu Rohani');

insert into bank_soalan_files (folder_id, title, file_url)
select id, 'Topikal Bab 1-3 (Set A)', 'https://example.com/topikal-a.pdf'
from bank_soalan_folders where tingkatan='T4' and name='Topikal' limit 1;

with a as (select id from announcements order by created_at limit 1)
insert into announcement_comments (announcement_id, author_type, author_name, body)
select a.id, 'parent'::comment_author, 'Ahmad bin Ali', 'Terima kasih cikgu, jadual diterima.' from a
union all
select a.id, 'admin'::comment_author, 'Pemilik', 'Sama-sama. Jumpa di kelas!' from a;
