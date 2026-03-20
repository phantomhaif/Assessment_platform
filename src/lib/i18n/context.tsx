"use client"

import { createContext, useContext, useEffect, ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { dictionaries, Locale, Dictionary } from "./dictionaries"
import { getPlatformDescription, getPlatformTitle } from "@/lib/brand"
import {
  LOCALE_COOKIE,
  buildLocalizedPath,
  getLocaleFromPathname,
} from "./routing"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_KEY = "preferred_locale"

export function I18nProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const locale = getLocaleFromPathname(pathname) ?? "ru"

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(LOCALE_KEY, newLocale)
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; samesite=lax`

    const localizedPath = buildLocalizedPath(pathname, newLocale)
    const queryString = typeof window === "undefined" ? "" : window.location.search.replace(/^\?/, "")
    router.replace(queryString ? `${localizedPath}?${queryString}` : localizedPath)
  }

  const t = dictionaries[locale] as Dictionary

  useEffect(() => {
    localStorage.setItem(LOCALE_KEY, locale)
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; samesite=lax`
    document.documentElement.lang = locale
    document.title = getPlatformTitle(locale)

    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute("content", getPlatformDescription(locale))
    }
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return context
}

export function useTranslation() {
  const { t } = useI18n()
  return t
}
