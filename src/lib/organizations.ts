export const ORGANIZATION_TYPES = ["EDUCATIONAL", "COMMERCIAL"] as const

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number]

const TYPE_ALIASES: Record<string, OrganizationType> = {
  EDUCATIONAL: "EDUCATIONAL",
  EDUCATION: "EDUCATIONAL",
  SCHOOL: "EDUCATIONAL",
  UNIVERSITY: "EDUCATIONAL",
  COLLEGE: "EDUCATIONAL",
  COMMERCIAL: "COMMERCIAL",
  BUSINESS: "COMMERCIAL",
}

export function normalizeOrganizationName(value: unknown) {
  if (typeof value !== "string") return null
  const normalized = value.replace(/\s+/g, " ").trim()
  return normalized.length > 0 ? normalized : null
}

export function normalizeOrganizationType(value: unknown) {
  if (typeof value !== "string") return null

  const normalized = value.replace(/\s+/g, " ").trim().toUpperCase()
  if (!normalized) return null

  return TYPE_ALIASES[normalized] || null
}

export function getOrganizationTypeLabel(type: string | null | undefined, locale: "ru" | "en") {
  const normalized = normalizeOrganizationType(type)

  if (normalized === "EDUCATIONAL") {
    return locale === "ru" ? "Образовательная организация" : "Educational organization"
  }

  if (normalized === "COMMERCIAL") {
    return locale === "ru" ? "Коммерческая организация" : "Commercial organization"
  }

  return type || "—"
}

