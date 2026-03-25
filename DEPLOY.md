# Deploy Notes

Production server layout:

- app host: `/opt/Assessment_platform`
- deploy method: `docker compose`
- app port: `3000`
- external reverse proxy lives on another server
- env file: `.env.production`
- local database container: `postgres`

## Locale by country

The app now prefers locale in this order:

- `preferred_locale` cookie
- country header from proxy/CDN
- `Accept-Language`

Supported country headers:

- `CF-IPCountry`
- `X-Vercel-IP-Country`
- `CloudFront-Viewer-Country`
- `X-Country-Code`
- `X-Geo-Country`

If the proxy sends `RU`, the app redirects first-time visitors to `/ru`. Any other country code redirects to `/en`.

If the external reverse proxy does not already add one of these headers, configure it to pass a two-letter ISO country code. Example for Nginx with GeoIP2:

```nginx
proxy_set_header X-Country-Code $geoip2_data_country_code;
```

## Standard update flow

Run on the app server:

```bash
cd /opt/Assessment_platform
sudo git pull
sudo docker compose --env-file .env.production build app
sudo docker compose --env-file .env.production run --rm --user root app sh -lc 'npx -y prisma@5.22.0 db push --skip-generate --schema prisma/schema.prisma'
sudo docker compose --env-file .env.production up -d app
sudo docker compose --env-file .env.production logs --tail=100 app
```

Use `db push` only when Prisma schema changed. If only UI, API, env, or mail settings changed, skip the `db push` command.

## Always use env file

Correct:

```bash
sudo docker compose --env-file .env.production build app
sudo docker compose --env-file .env.production up -d app
```

Do not run compose commands without `--env-file .env.production`, otherwise the app may start with wrong secrets or DB credentials.

## Backup before risky updates

```bash
cd /opt/Assessment_platform
sudo docker compose exec postgres pg_dump -U postgres -Fc assessment_platform > backup_before_update.dump
```

## If git pull is blocked by local Prisma schema

```bash
cd /opt/Assessment_platform
sudo cp prisma/schema.prisma /root/schema.prisma.server.backup
sudo git stash push -m "server-local-prisma-before-update" -- prisma/schema.prisma
sudo git pull
```

## If git reports dubious ownership

```bash
sudo git config --global --add safe.directory /opt/Assessment_platform
```

## Email providers

Current mail strategy:

- primary provider: `Resend`
- fallback provider: `SMTP` (for example, `Brevo`)

Required env values for Resend:

```env
RESEND_API_KEY=
EMAIL_FROM=Industry Skills <noreply@yourdomain.com>
```

Required env values for SMTP fallback:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=Industry Skills <noreply@yourdomain.com>
```

The server-side `docker-compose.yml` for the `app` service must pass all of these variables into the container:

```yaml
RESEND_API_KEY: ${RESEND_API_KEY:-}
EMAIL_FROM: ${EMAIL_FROM:-}
SMTP_HOST: ${SMTP_HOST:-}
SMTP_PORT: ${SMTP_PORT:-587}
SMTP_SECURE: ${SMTP_SECURE:-false}
SMTP_USER: ${SMTP_USER:-}
SMTP_PASS: ${SMTP_PASS:-}
SMTP_FROM: ${SMTP_FROM:-}
```

If only mail env values changed, deploy with:

```bash
cd /opt/Assessment_platform
sudo docker compose --env-file .env.production build app
sudo docker compose --env-file .env.production up -d app
sudo docker compose --env-file .env.production logs --tail=100 app
```

## Health check

Successful app startup usually ends with something like:

```text
Starting...
Ready in ...
```

Check:

```bash
sudo docker compose --env-file .env.production logs --tail=100 app
```

## What to send in a new troubleshooting session

If build failed:

```bash
sudo docker compose --env-file .env.production build app
```

Send the exact error text.

If app starts but email does not send:

```bash
sudo docker compose --env-file .env.production logs --tail=200 app
```

Also send:

```bash
cd /opt/Assessment_platform
cat docker-compose.yml
cat .env.production
sudo docker compose ps
```

Mask secrets before sending them.

## Security

If secrets were pasted into chat, rotate them afterwards:

- `AUTH_SECRET`
- `DB_PASSWORD` if exposed
- `RESEND_API_KEY` if exposed
- `SMTP_PASS` if exposed
