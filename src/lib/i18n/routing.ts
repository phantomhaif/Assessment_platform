import type { Locale } from "./dictionaries"

export const LOCALES = ["ru", "en"] as const
export const DEFAULT_LOCALE: Locale = "ru"
export const LOCALE_COOKIE = "preferred_locale"
const RUSSIAN_SEGMENT_COUNTRIES = new Set(["RU"])

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "ru" || value === "en"
}

export function getLocaleFromPathname(pathname: string): Locale | null {
  const [, maybeLocale] = pathname.split("/")
  return isLocale(maybeLocale) ? maybeLocale : null
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname)
  if (!locale) {
    return pathname || "/"
  }

  const stripped = pathname.slice(`/${locale}`.length)
  return stripped || "/"
}

export function buildLocalizedPath(pathname: string, locale: Locale) {
  const normalizedPath = stripLocaleFromPathname(pathname)
  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`
}

function normalizeCountryCode(countryCode?: string | null): string | null {
  const normalized = countryCode?.trim().toUpperCase()
  return normalized && /^[A-Z]{2}$/.test(normalized) ? normalized : null
}

export function resolveRequestLocale(
  cookieLocale?: string | null,
  acceptLanguage?: string | null,
  countryCode?: string | null
): Locale {
  if (isLocale(cookieLocale)) {
    return cookieLocale
  }

  const normalizedCountryCode = normalizeCountryCode(countryCode)
  if (normalizedCountryCode) {
    return RUSSIAN_SEGMENT_COUNTRIES.has(normalizedCountryCode) ? "ru" : "en"
  }

  const preferredLanguage = acceptLanguage?.split(",")[0]?.trim().toLowerCase() || ""
  return preferredLanguage.startsWith("en") ? "en" : DEFAULT_LOCALE
}
