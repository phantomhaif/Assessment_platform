import type { Locale } from "@/lib/i18n/dictionaries"

export const platformNames: Record<Locale, string> = {
  ru: "Платформа оценки знаний в ходе соревнований профессионального мастерства",
  en: "KA - knowledge assessment",
}

export const platformDescriptions: Record<Locale, string> = {
  ru: "Платформа оценки знаний в ходе соревнований профессионального мастерства Industry Skills",
  en: "Knowledge assessment platform for Industry Skills professional mastery competitions",
}

export function getPlatformName(locale: Locale) {
  return platformNames[locale]
}

export function getPlatformTitle(locale: Locale) {
  return `INDUSTRY SKILLS - ${getPlatformName(locale)}`
}

export function getPlatformDescription(locale: Locale) {
  return platformDescriptions[locale]
}
