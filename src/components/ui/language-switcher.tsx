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
      className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.035] px-3 py-1.5 text-sm font-semibold text-[#dce4f0] transition-colors hover:border-[#C41E3A]/50 hover:bg-[#C41E3A]/10 hover:text-white"
      title={locale === "ru" ? "Switch to English" : "Переключить на русский"}
    >
      <Globe className="h-4 w-4" />
      <span className="uppercase">{locale}</span>
    </button>
  )
}
