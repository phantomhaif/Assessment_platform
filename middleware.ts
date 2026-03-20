import { NextRequest, NextResponse } from "next/server"
import {
  LOCALE_COOKIE,
  buildLocalizedPath,
  getLocaleFromPathname,
  resolveRequestLocale,
  stripLocaleFromPathname,
} from "@/lib/i18n/routing"

const PUBLIC_FILE = /\.[^/]+$/

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
      request.headers.get("accept-language")
    )
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = buildLocalizedPath(pathname, resolvedLocale)
    return NextResponse.redirect(redirectUrl)
  }

  const rewrittenUrl = request.nextUrl.clone()
  rewrittenUrl.pathname = stripLocaleFromPathname(pathname)

  const response = NextResponse.rewrite(rewrittenUrl)
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/", sameSite: "lax" })
  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
}
