"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { dictionaries, Locale, Dictionary } from "./dictionaries"

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Dictionary
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

const LOCALE_KEY = "preferred_locale"

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ru")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Load saved locale from localStorage
    const savedLocale = localStorage.getItem(LOCALE_KEY) as Locale | null
    if (savedLocale && (savedLocale === "ru" || savedLocale === "en")) {
      setLocaleState(savedLocale)
    } else {
      // Detect browser language
      const browserLang = navigator.language.split("-")[0]
      if (browserLang === "en") {
        setLocaleState("en")
      }
    }
    setMounted(true)
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem(LOCALE_KEY, newLocale)
  }

  const t = dictionaries[locale]

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: "ru", setLocale, t: dictionaries.ru }}>
        {children}
      </I18nContext.Provider>
    )
  }

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
