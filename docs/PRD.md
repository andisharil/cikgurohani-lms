# Product Requirements Document — cikgurohani.com LMS + Parent/Student Portal

**Status:** Draft v1.0
**Last updated:** 2026-06-19
**Source:** Project Brief — cikgurohani.com LMS Admin + Parent/Student Portal
**Stack (decided):** Next.js (App Router, TypeScript) + Supabase (Postgres, Auth, Storage) + BayarCash + Meta WhatsApp Cloud API

---

## 1. Overview

cikgurohani.com is a Malaysian SPM tuition business teaching Form 4 (T4) and Form 5 (T5). This project converts an existing **frontend-only React prototype** (local state, dummy data, simulated payments/messaging, demo date fixed to 11 June 2025) into a **production system** with a real backend, database, authentication, file storage, payment gateway, WhatsApp Business API, email, and a job scheduler.

The system has four parts:

1. **Admin Panel** — manage parents, students, content, payments, refunds, WhatsApp/WABA, notifications, finance, and settings.
2. **Parent Portal** — view children, fees, transactions, reports, class materials; renew subscriptions; request changes; comment.
3. **Student Portal** — access class materials, recordings, Zoom links, and Bank Soalan gated by subscription status and package.
4. **Payment + Notification Workflow** — renewal, payment confirmation, refunds, WhatsApp templates, email, and portal notifications.

## 2. Goals & Success Metrics

**Primary goal:** Give cikgurohani a self-serve admin + parent/student portal that automates subscription lifecycle, access control, payments, and notifications.

**Success metrics:**
- Admins manage the full student lifecycle without developer intervention.
- Subscription status is computed automatically and gates portal access correctly 100% of the time.
- Online payments auto-activate subscriptions via verified webhook; manual payments flow through admin approval.
- Every state-changing action is captured in an immutable activity log.
- Notifications deliver across portal/email/WhatsApp with retry on failure.

**Non-goals (this phase):**
- Zoom API auto-meeting creation (manual link management only).
- Automated reconciliation with bank statements (admin verifies manually).
- Native mobile apps (responsive web only).

## 3. Personas & Roles

### Admin roles (permissions configurable in Settings)
| Role | Focus | Typical access |
|------|-------|----------------|
| **Pemilik (Owner)** | Everything | All modules incl. kewangan, refund, permission management. Must always retain settings permission; system can never have zero owner. |
| **Pembantu (Assistant)** | Daily ops | Students, content, notifications, WABA, request refund, view profiles. Not necessarily refund processing or full finance. |
| **Finance** | Money | Kewangan, payment confirmation, refund, financial reports, CSV/export. Not necessarily content/settings edit. |

### Portal users
- **Parent** — email + password; sees all their children.
- **Student** — phone-only login (student phone OR parent phone); OTP/magic-link strongly recommended for production since the portal holds private data.

## 4. Scope — Functional Requirements

### 4.1 Subscription Status (derived, not stored)
Computed from `aktif` + `tarikh_tamat`:
| Condition | Status | Behavior |
|-----------|--------|----------|
| `aktif = false` | **Disekat** | Portal locked; "account blocked, contact admin" overlay + CTA. |
| `aktif = true` & `tarikh_tamat < today` | **Tamat** | Parent can login & renew; content/Zoom/Bank Soalan locked; renewal popup. Student told to ask parent to renew. |
| `aktif = true` & days left ≤ 7 | **Akan Tamat** | Full access; dashboard highlight; reminders can fire. |
| `aktif = true` & days left > 7 | **Aktif** | Full access per package. |

### 4.2 Packages & Pricing
| Package | T4 / T5 | T4&5 | Duration |
|---------|---------|------|----------|
| Bulanan | RM80 | RM160 | 1 month |
| 3 Bulan | RM230 | RM460 | 3 months |
| 6 Bulan | RM450 | RM900 | 6 months |

**Expiry calculation:** base date = `today` if currently expired, else `current tarikh_tamat`; new expiry = base date + package duration.

### 4.3 Package Access Logic
**Expired (Tamat) content policy: VIEW LIMITED (decided).** Expired users keep read-only/preview access to Bahan Kelas and Rakaman with a persistent "renew to continue" CTA banner; live actions stay gated — Zoom join is locked (§6.3) and Bank Soalan stays locked behind the package rule + renewal. This gives a taste of content while driving renewal, rather than a hard lock to home + fees only.
- **Bahan Kelas:** all packages while status ≠ Disekat. Expired (Tamat) → view-limited: list/preview visible with renewal CTA; full download gated until renewal.
- **Rakaman:** by tingkatan — T4 sees T4 + "Kedua-dua"; T5 sees T5 + "Kedua-dua"; T4&5 sees all.
- **Zoom Link:** Aktif/Akan Tamat can join; Tamat → locked w/ renew message; Disekat → blocked overlay.
- **Bank Soalan:** **only 3 Bulan & 6 Bulan packages.** Bulanan → upsell CTA "Mohon Tukar Pakej". Folder access follows tingkatan (T4&5 sees both folders).

### 4.4 Admin Modules
1. **Dashboard** — active students, monthly revenue (permission-gated), expiring-in-7-days count, renewal rate, counts per tingkatan, notifications sent today, package-distribution chart, revenue/new-student charts (permission-gated), "needs attention" list (Akan Tamat/Tamat), recent notification log, pending-request alerts. Empty/failed/permission states handled.
2. **Student List** — search (student name/ID, parent name/email), filter (status, tingkatan), sort, CSV export (permission-gated), row → Parent Profile. Empty + no-permission states.
3. **Parent Profile** — tabs: Maklumat / Sejarah Pembayaran / Log Aktiviti / Notifikasi / Nota. Actions: edit parent/student, adjust package, extend, block/unblock, view receipt, request refund, resend notification, send WABA template, internal notes. Duplicate-flag warning; Parent-ID-change migration rules (see §6).
4. **Add New Student** — parent info + student info + payment sections. Auto-generate Parent/Student IDs; compute expiry & price; on save create parent, student, payment, registration email, portal notification, activity log. Required: parent name/phone/email, student name. Production should support attaching a student to an existing parent.
5. **Laras / Edit Student Package** — update ID/name/phone/tingkatan/package/expiry/active. Bank Soalan access opens/closes on package up/downgrade; package-request execution marks request Selesai + notifies. Student phone via admin = immediate; via portal = needs approval (login key). Expiry in the past → auto Tamat.
6. **Manual Extend Subscription** — choose package + start date, auto-calc expiry; reopening a blocked student requires confirmation; updates package/expiry/active, logs, and (if from renewal) sets renewal Diluluskan.
7. **Block / Unblock Student** — block requires internal reason (never shown to parent), sets `aktif=false`, auto-rejects pending renewals, sends generic notification. Unblock sets `aktif=true` + notifies. All logged.

### 4.5 Content Management
Tabs: Bahan Kelas / Rakaman / Bank Soalan / Pengumuman / Laporan Pelajar / Zoom Link.
- **Bahan Kelas:** upload PDF, set target (T4/T5/Kedua-dua), edit/delete, optional auto-announcement. Production: real upload, store URL/size/MIME, virus & type validation, access control.
- **Rakaman:** title + URL (e.g. YouTube) + target, edit/delete, optional announcement; invalid URL blocked; visibility by tingkatan.
- **Bank Soalan:** folder-style nav (T4/T5 → Topikal, Ujian Percubaan, Soalan Sebenar SPM). Create/reorder folders, upload/preview/download/delete PDFs, optional announcement. Access only 3/6-month; Bulanan upsell; folders by tingkatan. Upload without folder blocked; deletes reflect immediately.
- **Pengumuman:** create/edit/delete, audience (Semua/T4/T5), CTA type (zoom/bahan/rakaman/bank). Portal filters by tingkatan; CTA bank + Bulanan → upsell. **Comments:** parent/student comment, admin replies in thread; empty comment blocked; linked to announcement ID.
- **Laporan Pelajar:** monthly report by tingkatan (Bulan, Ringkasan guru, Guru, Tarikh publish); portal filters by tingkatan; empty state.
- **Zoom Link:** update T4/T5 links, save + optional announcement; portal visibility by tingkatan/status. Optional Zoom API not required.

### 4.6 Parent / Student Portal
- **Login:** parent = email+password (sees all children); student = **phone + OTP (decided)** — student enters student phone OR parent phone, receives a one-time code (WhatsApp/SMS) to verify; multi-child match → child selection after verify. No standing password for students. Errors: phone not found, "—" phone can't login, invalid/expired OTP, rate-limit on resend.
- **Language:** BM/EN; tab mapping preserved on switch.
- **Onboarding:** 4-step for active non-expired students; expired skip to renewal.
- **Parent Dashboard:** welcome, child cards (nama, tingkatan, pakej, tarikh tamat, status, days left), click → child view.
- **Expired flow:** modal overlay, renew options limited to Bulanan / 3 Bulan (prototype rule), "Lihat kandungan dahulu" temporary dismiss.
- **Renew / Pay Fees:** choose package → method (online BayarCash/FPX/DuitNow OR manual QR/transfer + receipt) → submit → thank you/pending. Manual → renewal `Menunggu`; online callback → `Diluluskan`, updates package/expiry, payment txn, notifications, log. Edge cases: missing receipt blocks submit; existing pending hides renew; rejection banner + resubmit; failed callback does not extend.

### 4.7 Payment Approval (`Pengesahan Bayaran`)
Sections: renewal requests, package-change requests, profile-change requests.
- **Approve renewal:** view receipt → verify bank → "Sahkan & Lanjutkan" → choose package/start → confirm. Sets Diluluskan, updates package/expiry/active, logs + notifications. Blocked-student reopen needs confirm; permission-gated; no double-approve.
- **Reject renewal:** pick reason (no record / amount mismatch / invalid receipt / receipt reused) → Ditolak, store reason, notify, log; no expiry change; parent can resubmit.
- **Package change request:** create `Baharu`, admin executes via Laras (prefilled) → Selesai + notify. Does not auto-change; may need payment first.
- **Profile change request:** sensitive (esp. student phone = login key). Old phone stays active until approved. Approve → update + notify; reject → no change + notify. Parent name/email/phone may sync immediately; student phone must not.

### 4.8 Refund Workflow
- **Request:** select payment, amount, reason, method (bank account / QR DuitNow upload). Creates `Dimohon`, adds to Refund page, logs, notifies owner. Amount ≤ original; no double refund; method-specific fields required.
- **Process (permission `prosesRefund`):** upload transfer receipt → mark `Selesai`; tags original payment refunded, notifies parent, logs. Cannot complete without receipt; payment history shows REFUNDED; refund does not auto-cancel subscription unless a business rule says so.

### 4.9 Notifications
Channels: Portal / Email / WhatsApp. Types: 7-day reminder, 3-day reminder, 3-days-after-expiry, access expired, registration, new content, renewal, refund, profile change, package change, account blocked/unblocked. Admin log: filter by date/channel/type, see success/fail, retry. Failed → red row + resend; retries re-call provider and update status; store provider response; log immutable / keep retry history.

### 4.10 WABA / WhatsApp Module
Tabs: Dashboard / Device Manager / Inbox / Template / Blaster / Contacts / File Manager.
- Dashboard: sent today, delivery rate, failed, active templates, 7-day chart, device status/quota.
- Device Manager: connected numbers (name/phone/status/quality/quota), add/reconnect/disconnect. Production: Meta WhatsApp Cloud API.
- Inbox: parent conversations, unread count, threads, send within 24-h window, mark read. Outside window → template only; store webhook events.
- Template: view/create, category Utility/Marketing, `{{n}}` variables, submit for Meta approval, resubmit rejected. Only approved usable; marketing → opt-in only.
- Blaster: approved template + audience (Semua/T4/T5/Akan Tamat ≤7/Tamat) + schedule (now/8PM/9AM tomorrow). Marketing → opt-in filter; scheduled → queue/worker; log each send.
- Contacts: sync from parents (name/phone/labels/marketing opt-in/chat).
- File Manager: upload media (image/PDF) for templates; object storage; register to Meta; validate type/size.

### 4.11 Finance Module
Metrics: revenue by period, MRR, active subscriptions, ARPU, renewal rate, churn rate, avg subscription duration, LTV, revenue chart, revenue by package, channel split, recent transactions. Periods: Harian/Mingguan/Bulanan/Suku Tahun/YTD. Actions: PDF report, CSV export, view/download receipt. Revenue is computed from actual paid transactions only (status Berjaya).

**Finance definitions (decided — see §6a):** all figures are **net** (refunds deducted). MRR uses normalized monthly value of active subscriptions; churn is monthly logo churn; LTV = ARPU ÷ monthly churn.

### 4.12 Settings
Manage admin users (add/role/remove), permission matrix by role, reset to default, save WhatsApp community link, default portal language. Rules: owner retains settings permission; never zero owner; changes apply immediately and are logged.

## 5. Data Model

Entities (Postgres; relational links between parent ↔ student ↔ payments/renewals/refunds/logs/notifications):

- **Parent** — id (`PAR-00001`), nama, emel, telefon, lokasi, tarikh_daftar, duplicate_parent_id?, username_display?, created_at, updated_at
- **Student** — id (`STU-00001`), parent_id, nama, telefon, tingkatan (T4/T5/T4&5), pakej (Bulanan/3 Bulan/6 Bulan), tarikh_mula, tarikh_tamat, saluran_bayaran (BCL/BayarCash/Manual/Pindahan Bank), aktif, created_at, updated_at
- **Payment/Transaction** — id/reference_no, parent_id, student_id, tarikh, pakej, jumlah, saluran, ref, resit_url, refunded_by_refund_id?, status (Berjaya/Menunggu/Ditolak/Refunded), created_at
- **Renewal Request** — id (`RNW-0007`), parent_id, student_id, pakej, jumlah, resit_url, status (Menunggu/Diluluskan/Ditolak), sumber (Portal/BayarCash/Manual), sebab_tolak, lulus_oleh, lulus_masa, created_at
- **Package Change Request** — id (`REQ-0004`), parent_id, student_id, dari_pakej, ke_pakej, status (Baharu/Selesai/Ditolak), created_at
- **Profile Change Request** — id (`PRF-0001`), parent_id, student_id, field, old_value, new_value, status (Baharu/Selesai/Ditolak), requested_by, reviewed_by, created_at
- **Refund** — id (`RFD-0003`), parent_id, student_id, payment_ref, jumlah, sebab, kaedah (Akaun bank/QR DuitNow), akaun/qr_url, status (Dimohon/Selesai), requested_by, processed_by, resit_refund_url, notified, created_at, completed_at
- **Content** — bahan kelas, rakaman, bank soalan (+ folders), pengumuman (+ comments), laporan pelajar, zoom links (unified or separate tables)
- **Notification** — id, parent_id, student_id?, channel (Portal/Email/WhatsApp), type, message, status (Berjaya/Gagal/Menunggu), baca, provider_response, created_at
- **Activity Log** — id, parent_id, student_id?, type (log_masuk/pakej/notifikasi/edit/refund), message, actor, internal_note, created_at
- **Admin User / Role / Permission matrix** — for Settings

## 6. Key Business Rules (must get right)

1. **Student phone = login key.** Phone change via admin = immediate; via portal = profile-change request requiring approval; old phone valid until approved.
2. **Parent ID change** — blocked if a pending refund/renewal/package request exists; otherwise migrate ALL related records (students, logs, refunds, renewals, package requests, portal notifications, usernames, payments).
3. **Block student** auto-rejects pending renewals (→ Ditolak); internal reason logged but never exposed to parent.
4. **Permissions enforced server-side** (RLS + API checks), not just hidden in UI. Owner can never be removed/zeroed.
5. **Expiry math** as in §4.2.
6. **Bank Soalan** gated to 3/6-month packages; downgrade revokes access.
7. **Online payment** extends only on verified callback; failed callback never extends.
8. **Refund** completion requires receipt; tags payment REFUNDED; does not auto-cancel subscription.

## 6a. Finance Definitions (decided)

Chosen defaults (net-based, normalized for prepaid multi-month packages):

- **Net revenue (period)** = sum of paid transactions (status Berjaya) with `tarikh` in period − sum of refunds (status Selesai) with `completed_at` in period.
- **Normalized MRR** = Σ over active subscriptions of `(package price ÷ package duration in months)`. E.g. a 6-month T4&5 (RM900) contributes RM150/mo; a Bulanan T4 (RM80) contributes RM80/mo. Refunded/inactive subs excluded. (Normalizing avoids MRR spikes when 3/6-month packages are paid upfront.)
- **Active subscriptions** = students with status Aktif or Akan Tamat (i.e. `aktif=true` and not expired).
- **ARPU (period)** = net revenue (period) ÷ active subscriptions (period).
- **Renewal rate (period)** = renewals approved in period ÷ subscriptions that expired in period.
- **Churn rate (monthly, logo churn)** = students who lapsed during the month without renewing within a 7-day grace window ÷ active subscriptions at the start of the month.
- **Average subscription duration** = mean of `(tarikh_tamat − tarikh_mula)` across subscriptions, in months.
- **LTV** = ARPU ÷ monthly churn rate (falls back to ARPU × average duration when churn ≈ 0).
- **Refund effect:** refunds reduce net revenue and net MRR (the underlying subscription is *not* auto-cancelled — that stays an explicit admin action, per §6 rule 8).

These formulas are the single source of truth for the Finance module; revisit with the client once real data accrues.

## 7. Non-Functional Requirements

- **Security:** server-side permission checks on every admin action; file type/size validation; payment webhook signature verification; never expose internal block/refund reasons; admin-only sensitive logs; HTTPS only.
- **Auditability:** activity log for add/edit student, package change, renewal approve/reject, block/unblock, refund request/complete, profile-change approval, notification retry, permission change.
- **Performance:** paginated + searchable student list and notification log; WABA inbox loads by thread; files via CDN/object storage.
- **Reliability:** queue for WABA/email; store failed attempts + retry; idempotent payment webhooks.

## 8. Integrations

| Concern | Choice |
|---------|--------|
| Auth | Supabase Auth (admin email+password / parent email+password) + student **phone OTP delivered via WhatsApp** (Meta Cloud API authentication template; custom OTP issue/verify, since delivery goes through WABA not Supabase's SMS provider) |
| Database | Supabase Postgres (with RLS) |
| File storage | Supabase Storage (materials, Bank Soalan, receipts, refund receipts, WABA media, QR) |
| Payment | BayarCash (FPX/DuitNow): create-checkout + signed webhook; manual = receipt upload + admin approval |
| WhatsApp | Meta WhatsApp Cloud API (templates, send, delivery/inbound webhooks, media, opt-in) |
| Email | Transactional provider (Resend/SES/SendGrid): registration, password reset, renewal, failed payment, content update |
| Scheduler | Supabase pg_cron / scheduled Edge Functions: 7-day & 3-day reminders, expiry-day notice, 3-day-after follow-up, scheduled blasts, optional daily finance summary |
| Export | CSV (students, transactions), PDF (finance reports, receipts) |

## 9. Suggested API Surface

Auth (`/auth/*`), Parents & Students (`/parents`, `/students`, block/unblock), Payments & Renewals (`/payments`, `/renewals/*`, `/payments/bayarcash/create-checkout`, `/webhooks/bayarcash`), Refunds (`/refunds`, `/refunds/:id/complete`), Content (`/content/*`), Notifications (`/notifications/*`, `/portal-notifications/:id/read`), WABA (`/waba/*`, `/webhooks/waba`), Settings (`/settings/permissions`, `/admin-users/*`). Full list in brief §18.

## 10. Milestones (proposed)

1. **M0 — Foundation:** scaffold Next.js + Supabase, schema migrations + RLS, auth for 3 user types, permission matrix, activity-log primitive.
2. **M1 — Student lifecycle:** add/edit/laras student, status engine, block/unblock, student list, parent profile.
3. **M2 — Content + portals:** content modules, parent/student portals, access gating, announcements/comments.
4. **M3 — Payments:** manual + BayarCash online, renewal approval, expiry math, webhooks.
5. **M4 — Refunds + Finance:** refund workflow, finance dashboard from real transactions, CSV/PDF export.
6. **M5 — Notifications + WABA:** notification engine + retry, email, Meta Cloud API, templates/blaster/inbox, scheduler/cron.
7. **M6 — Hardening:** security review, audit coverage, performance (pagination/CDN), reliability (queues/idempotency).

## 11. Acceptance Criteria

System is ready when (per brief §21): role-correct admin login & module visibility; create parent/student + record payment; automatic status updates; parent login + view children; secure student login + gated content; expired renewal flow; manual renewal → pending; approve/reject renewal; online callback auto-activates; Bank Soalan follows package rule; upload materials/recordings/question bank; portal content filtered by tingkatan + package; announcements + comment replies; refund request→completion; WABA template send + logs; notification failure/retry; finance from real transactions; CSV/PDF export; activity logs on all important actions; permissions enforced front + back end.

## 12. Decisions & Open Questions

**Resolved (2026-06-19):**
1. ✅ **Expired content policy** — **View Limited** (preview + renewal CTA; live actions gated). See §4.3.
2. ✅ **Student login** — **Phone + OTP**. See §4.6, §8.
3. ✅ **Finance definitions** — net-based, normalized MRR, monthly logo churn, LTV = ARPU ÷ churn. See §6a.
4. ✅ **OTP delivery channel** — **WhatsApp** via Meta Cloud API (no extra vendor). SMS fallback can be added later if WhatsApp delivery proves unreliable. See §8.

**Still open:**
5. **Existing-parent attach** — support attaching a new student to an existing parent at registration (recommended for production).
6. **Email/Zoom providers** — confirm transactional email provider (default: Resend); confirm Zoom stays manual-link-only this phase.
