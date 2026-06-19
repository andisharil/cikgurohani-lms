-- cikgurohani LMS — non-demo defaults: permission matrix, settings, zoom rows,
-- initial Bank Soalan folders. (Demo/dev data is seeded separately.)

-- Permission matrix defaults (PRD §3.1). Owner is always allowed in code via
-- has_permission(), but we seed all rows so the Settings UI can render/toggle.
insert into role_permissions (role, permission, allowed) values
  -- Pemilik: full access
  ('Pemilik','pelajar',true), ('Pemilik','tambah_pelajar',true), ('Pemilik','kandungan',true),
  ('Pemilik','notifikasi',true), ('Pemilik','waba',true), ('Pemilik','sahkanBayaran',true),
  ('Pemilik','kewangan',true), ('Pemilik','mohonRefund',true), ('Pemilik','prosesRefund',true),
  ('Pemilik','tetapan',true), ('Pemilik','permission',true),
  -- Pembantu: daily ops, no finance/refund-processing/settings
  ('Pembantu','pelajar',true), ('Pembantu','tambah_pelajar',true), ('Pembantu','kandungan',true),
  ('Pembantu','notifikasi',true), ('Pembantu','waba',true), ('Pembantu','sahkanBayaran',false),
  ('Pembantu','kewangan',false), ('Pembantu','mohonRefund',true), ('Pembantu','prosesRefund',false),
  ('Pembantu','tetapan',false), ('Pembantu','permission',false),
  -- Finance: money only
  ('Finance','pelajar',false), ('Finance','tambah_pelajar',false), ('Finance','kandungan',false),
  ('Finance','notifikasi',false), ('Finance','waba',false), ('Finance','sahkanBayaran',true),
  ('Finance','kewangan',true), ('Finance','mohonRefund',true), ('Finance','prosesRefund',true),
  ('Finance','tetapan',false), ('Finance','permission',false);

insert into app_settings (key, value) values
  ('default_language', '"ms"'::jsonb),
  ('whatsapp_community_link', '""'::jsonb),
  ('expired_content_policy', '"view_limited"'::jsonb);

-- Zoom link rows (one per tingkatan; urls filled by admin later)
insert into zoom_links (tingkatan, url) values ('T4', null), ('T5', null);

-- Initial Bank Soalan folder structure (PRD §8.3)
insert into bank_soalan_folders (tingkatan, name, sort_order) values
  ('T4','Topikal',1), ('T4','Ujian Percubaan',2), ('T4','Soalan Sebenar SPM',3),
  ('T5','Topikal',1), ('T5','Ujian Percubaan',2), ('T5','Soalan Sebenar SPM',3);
