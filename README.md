# cikgurohani LMS + Parent/Student Portal

Production LMS for **cikgurohani.com** (SPM tuition, Form 4 / Form 5). Admin panel,
parent portal, and student portal with subscription lifecycle, payments, refunds,
content gating, notifications, and WhatsApp.

- **Stack:** Next.js 16 (App Router, TS, Tailwind 4) · Supabase (Postgres + Auth + Storage + pg_cron) · BayarCash · Meta WhatsApp Cloud API · Resend
- **Hosting:** host-agnostic — Next.js `standalone` output + Dockerfile (deploy to Vercel or any VPS). All stateful infra lives in Supabase.
- Full spec: [docs/PRD.md](docs/PRD.md). Build log: [tasks/todo.md](tasks/todo.md).

## Setup

1. **Install**
   ```bash
   pnpm install
   ```
2. **Environment** — `.env.local` already has the Supabase URL + publishable key for the
   dev project. Add the secret service-role key (Supabase Dashboard → Project Settings →
   API → `service_role`):
   ```
   SUPABASE_SERVICE_ROLE_KEY=...
   ```
   Integration keys (BayarCash / WhatsApp / Resend) are optional in dev — those services
   are **simulated** (logged) until configured. See `.env.example`.
3. **Seed the owner admin** (after the service-role key is set):
   ```bash
   node --env-file=.env.local scripts/seed-admin.mjs
   # → admin@cikgurohani.com / cikguAdmin123!  (override via SEED_ADMIN_EMAIL/PASSWORD)
   ```
4. **Run**
   ```bash
   pnpm dev      # http://localhost:3000
   pnpm build && pnpm start
   ```

### Logins
- **Admin / Parent:** `/login` (email + password)
- **Student:** `/student/login` (phone → WhatsApp OTP; in dev the code is shown on screen)

Demo data (3 parents, 5 students across all four statuses, payments, a pending renewal) is
already seeded; see [supabase/seed.sql](supabase/seed.sql).

## Database

Migrations live in [supabase/migrations](supabase/migrations) and are applied to the dev
project. Regenerate types after schema changes and update
[src/lib/supabase/database.types.ts](src/lib/supabase/database.types.ts).

- **Access model:** admins gated by `is_admin()` + a configurable permission matrix
  (enforced server-side in every action); parents are RLS-scoped to their own rows;
  students never connect directly (served via the service-role client after OTP verify);
  content is admin-managed and delivered to portals through gated server code.
- **Subscription status** (Aktif / Akan Tamat / Tamat / Disekat) is derived from
  `aktif` + `tarikh_tamat` via `student_status()` (SQL) mirrored in `src/lib/domain/status.ts`.

## Docker (any VPS)

```bash
docker build -t cikgurohani-lms \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY .
docker run -p 3000:3000 --env-file .env.local cikgurohani-lms
```

## Status

**Done:** auth (3 roles + student OTP), student lifecycle (add/edit/laras/extend, block,
status engine, list + CSV, parent profile), parent + student portals, payment approval
(renewal/package/profile), settings (permission matrix + admin users), content management
(materials/recordings/Bank Soalan/announcements/reports/Zoom), refunds, finance dashboard,
notifications log + retry, manual renew/pay flow, daily reminder cron (pg_cron), BayarCash
webhook skeleton.

**Pending / follow-ups:** real file uploads to Supabase Storage (URLs used for now), live
BayarCash + Meta WhatsApp + Resend wiring (simulated until keys added), WABA module UI
(Inbox/Template/Blaster), parent auth-account provisioning at registration, finance
churn/LTV (needs historical tracking), PDF report generation.
