import { NextRequest, NextResponse } from "next/server"
import {
  LOCALE_COOKIE,
  buildLocalizedPath,
  getLocaleFromPathname,
  resolveRequestLocale,
  stripLocaleFromPathname,
} from "@/lib/i18n/routing"

const PUBLIC_FILE = /\.[^/]+$/
const GEO_COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
  "x-country-code",
  "x-geo-country",
] as const

function getCountryCode(request: NextRequest): string | null {
  for (const header of GEO_COUNTRY_HEADERS) {
    const value = request.headers.get(header)
    if (value) {
      return value
    }
  }

  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next()
  }

  const locale = getLocaleFromPathname(pathname)

  if (!locale) {
    const resolvedLocale = resolveRequestLocale(
      request.cookies.get(LOCALE_COOKIE)?.value,
      request.headers.get("accept-language"),
      getCountryCode(request)
    )
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = buildLocalizedPath(pathname, resolvedLocale)
    return NextResponse.redirect(redirectUrl)
  }

  const rewrittenUrl = request.nextUrl.clone()
  rewrittenUrl.pathname = stripLocaleFromPathname(pathname)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-locale", locale)

  const response = NextResponse.rewrite(rewrittenUrl, {
    request: {
      headers: requestHeaders,
    },
  })
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax" })
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
