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

## Migration history
- Added protocol_assignments table: `prisma/migrations/20260212000000_add_protocol_assignments/`

## Previously fixed issues
- NEXTAUTH_URL env var had leading space — deleted & recreated
- Node.js 18→20 via .node-version file + engines in package.json
- tsconfig.tsbuildinfo Docker mount error → .dockerignore
- File uploads → /app/uploads in production (Railway Volume)
- DATABASE_URL uses public URL with ?sslmode=require for local migrations
