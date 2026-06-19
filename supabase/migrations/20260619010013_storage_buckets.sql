-- cikgurohani LMS — private storage buckets (PRD §16.3).
-- All access is server-side via the service-role client after permission/gating
-- checks; files reach users only through short-lived signed URLs. No public
-- access and no storage RLS policies are needed (service_role bypasses RLS;
-- anon/authenticated have no object access).
--   content  — class materials + Bank Soalan PDFs
--   receipts — payment/renewal/refund receipts + DuitNow QR (PDF or image)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content', 'content', false, 20971520, array['application/pdf']),
  ('receipts', 'receipts', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;
