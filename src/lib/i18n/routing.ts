import type { Locale } from "./dictionaries"

export const LOCALES = ["ru", "en"] as const
export const DEFAULT_LOCALE: Locale = "ru"
export const LOCALE_COOKIE = "preferred_locale"

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

export function resolveRequestLocale(cookieLocale?: string | null, acceptLanguage?: string | null): Locale {
  if (isLocale(cookieLocale)) {
    return cookieLocale
  }

  const preferredLanguage = acceptLanguage?.split(",")[0]?.trim().toLowerCase() || ""
  return preferredLanguage.startsWith("en") ? "en" : DEFAULT_LOCALE
}
