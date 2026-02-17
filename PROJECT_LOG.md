# Assessment Platform — Project Log

## Stack
- Next.js 16 (App Router), TypeScript, Prisma ORM, PostgreSQL
- Tailwind CSS, NextAuth.js, shadcn/ui components
- Deployed on Railway, repo: https://github.com/phantomhaif/Assessment_platform

## Railway
- App URL: (check Railway dashboard)
- DB: PostgreSQL, public URL via shinkansen.proxy.rlwy.net:48580
- Volume mount: /app/uploads (for file uploads — must be created manually in Railway Dashboard)
- Admin account: admin@example.com / admin123

## Key files
- `src/lib/i18n/dictionaries.ts` — RU/EN translation dictionaries
- `src/lib/i18n/context.tsx` — React context (useI18n hook → { t, locale, setLocale })
- `src/components/ui/language-switcher.tsx` — Globe icon switcher in header
- `src/app/layout.tsx` — wraps everything in I18nProvider
- `src/components/layout/sidebar.tsx` — navigation
- `src/components/layout/header.tsx` — top bar with LanguageSwitcher

## i18n Implementation Status

### ✅ DONE (fully localized)
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/events/page.tsx`
- `src/app/(dashboard)/events/[eventId]/page.tsx`
- `src/app/(dashboard)/profile/page.tsx`
- `src/app/(dashboard)/my-passports/page.tsx`
- `src/app/(dashboard)/regulations/page.tsx`
- `src/app/(dashboard)/regulations/[id]/page.tsx`
- `src/app/(dashboard)/admin/users/page.tsx`
- `src/app/(dashboard)/admin/events/page.tsx`
- `src/app/(dashboard)/admin/applications/page.tsx`
- `src/app/(dashboard)/admin/teams/page.tsx`
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/app/(auth)/login/page.tsx`

### ✅ ALL PAGES LOCALIZED — i18n complete

## Dictionary sections (in dictionaries.ts)
ru/en sections: common, nav, auth, events, teams, applications, profile,
passports, documents, scoring, roles, regulations, errors, dashboard, admin,
eventForm, documentsAdmin, passportsAdmin, regulationsAdmin, adminEvent, schemasAdmin

## Important notes
- Document/regulation/criteria NAMES are user-entered data stored in DB — cannot be i18n'd
- Only UI labels, buttons, headings, messages can be translated
- DeepStringify type helper used to avoid literal type conflicts
- Date formatting: `locale === "ru" ? ru : enUS` from date-fns

## Features added (session 2026-02-17)

### 1. CSV Export of Participants
- API: `GET /api/events/[eventId]/participants/export`
- Returns semicolon-delimited CSV: `Имя;Фамилия;Email` (UTF-8 BOM for Excel)
- Only includes users with APPROVED applications
- Button added to admin event detail page → Participants card

### 2. Admin User Management
- `POST /api/users` — admin creates new account (email, password, all profile fields, role)
- `PATCH /api/users/[userId]` — extended to update firstName, lastName, middleName, organization, position, phone (in addition to role)
- Admin users page: "Add User" button (opens modal), "Edit" button per row
- Modal works for both create (shows email+password fields) and edit (no email/password fields)

### 3. Email Verification on Login
- `POST /api/auth/send-code` — validates email+password, generates 6-digit OTP, stores in-memory (10 min TTL), sends via SMTP
- `src/lib/verification-codes.ts` — in-memory OTP store (Map)
- `src/lib/email.ts` — nodemailer transport (env vars: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM)
- Login page is now two-step: credentials → code input
- Falls back to direct sign-in when SMTP_HOST not configured (graceful degradation)
- `src/lib/auth.ts` — authorize() validates OTP when SMTP_HOST is set

### 4. Mass Email to Participants
- `POST /api/events/[eventId]/send-email` — sends bilingual HTML email to all APPROVED participants
- Admin page: `/admin/events/[eventId]/send-email`
- Fields: Subject, Body RU (required), Body EN (optional)
- Email shows both languages with flag labels, "Send Email" button in event detail header
- Live preview in admin compose page

### Railway env vars needed (for email features):
- SMTP_HOST — e.g. smtp.gmail.com
- SMTP_PORT — e.g. 587
- SMTP_SECURE — true for port 465, false for others
- SMTP_USER — SMTP username/email
- SMTP_PASS — SMTP password or app password
- SMTP_FROM — sender address (optional, defaults to SMTP_USER)

## Migration history
- Added protocol_assignments table: `prisma/migrations/20260212000000_add_protocol_assignments/`

## Previously fixed issues
- NEXTAUTH_URL env var had leading space — deleted & recreated
- Node.js 18→20 via .node-version file + engines in package.json
- tsconfig.tsbuildinfo Docker mount error → .dockerignore
- File uploads → /app/uploads in production (Railway Volume)
- DATABASE_URL uses public URL with ?sslmode=require for local migrations
