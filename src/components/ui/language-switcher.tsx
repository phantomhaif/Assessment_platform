"use client"

import { useI18n } from "@/lib/i18n/context"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  const toggleLocale = () => {
    setLocale(locale === "ru" ? "en" : "ru")
  }

  return (
    <button
      onClick={toggleLocale}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      title={locale === "ru" ? "Switch to English" : "Переключить на русский"}
    >
      <Globe className="h-4 w-4" />
      <span className="uppercase">{locale}</span>
    </button>
  )
}
