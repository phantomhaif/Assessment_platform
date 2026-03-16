export type EventLocale = "ru" | "en"

type LocalizedEventLike = {
  name: string
  nameEn?: string | null
  competency?: string | null
  competencyEn?: string | null
  description?: string | null
  descriptionEn?: string | null
}

export function getLocalizedEventName(event: LocalizedEventLike, locale: EventLocale) {
  return locale === "en" ? event.nameEn || event.name : event.name
}

export function getLocalizedCompetency(event: LocalizedEventLike, locale: EventLocale) {
  const fallback = event.competency || ""
  return locale === "en" ? event.competencyEn || fallback : fallback
}

export function getLocalizedDescription(event: LocalizedEventLike, locale: EventLocale) {
  const fallback = event.description || ""
  return locale === "en" ? event.descriptionEn || fallback : fallback
}
