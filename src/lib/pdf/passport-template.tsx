import React from "react"
import path from "node:path"
import {
  Circle,
  Document,
  Image,
  Page,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"

export type PassportLocale = "ru" | "en"

type ScoreRowData = {
  number?: number
  code?: string
  name: string
  score: number
  maxScore: number
}

export interface SkillPassportData {
  participantName: string
  participantMiddleName?: string
  organization: string
  eventName: string
  competency: string
  dateRange: string
  totalScore: number
  locale?: PassportLocale
  skillGroups: ScoreRowData[]
  modules: ScoreRowData[]
}

const colors = {
  red: "#BE1622",
  black: "#000000",
  nearBlack: "#1E1E1E",
  ink: "#010101",
  gray: "#7E878F",
  softGray: "#8C8C8C",
  divider: "#D5D9DE",
  waveDark: "#6F8297",
  waveLight: "#C8D2DD",
}

const logoBase = path.join(process.cwd(), "public", "templates", "passport-logos")

const logoSets = {
  ru: {
    top: [
      { key: "creonomika", src: path.join(logoBase, "ru", "creonomika.png"), width: 86, height: 18 },
      { key: "iitb", src: path.join(logoBase, "ru", "iitb.png"), width: 66, height: 18 },
      { key: "rpro-concern", src: path.join(logoBase, "ru", "rpro-concern.png"), width: 92, height: 18 },
    ],
    bottom: [
      { key: "rpds", src: path.join(logoBase, "ru", "rpds.png"), width: 96, height: 20 },
      { key: "rpro-robotics", src: path.join(logoBase, "ru", "rpro-robotics.png"), width: 110, height: 24 },
      { key: "robocomponent", src: path.join(logoBase, "ru", "robocomponent.png"), width: 100, height: 18 },
      { key: "picaso", src: path.join(logoBase, "ru", "picaso.png"), width: 96, height: 18 },
      { key: "vdn", src: path.join(logoBase, "ru", "vdn-clean.png"), width: 120, height: 24 },
    ],
  },
  en: {
    top: [
      { key: "creonomika", src: path.join(logoBase, "en", "creonomika.png"), width: 96, height: 18 },
      { key: "iitb", src: path.join(logoBase, "en", "iitb.png"), width: 56, height: 18 },
      { key: "rpro-concern", src: path.join(logoBase, "en", "rpro-concern.png"), width: 92, height: 18 },
    ],
    bottom: [
      { key: "rpds", src: path.join(logoBase, "en", "rpds.png"), width: 96, height: 20 },
      { key: "rpro-robotics", src: path.join(logoBase, "en", "rpro-robotics.png"), width: 110, height: 24 },
      { key: "robocomponent", src: path.join(logoBase, "en", "robocomponent.png"), width: 106, height: 18 },
      { key: "picaso", src: path.join(logoBase, "en", "picaso.png"), width: 96, height: 18 },
      { key: "vdn", src: path.join(logoBase, "en", "vdn-clean.png"), width: 120, height: 24 },
    ],
  },
} as const

const industryLogoSrc = path.join(logoBase, "common", "industry-skills.png")

const copy = {
  ru: {
    titleMain: "SKILLS PASSPORT",
    titleSub: "PASSPORT OF COMPETENCIES",
    competencyLabel: "по компетенции",
    signName: "А.В. КОРАБЛЕВ",
    signRole1: "Председатель правления Кластера «Креономика»",
    signRole2: "Академик Санкт-Петербургской Инженерной Академии",
    resultsTitle: "Полученные\nрезультаты",
    totalLabel: "из 100 баллов",
    skillSection: "Детализация полученных результатов в разрезе группы навыков / WSSS:",
    moduleSection: "Детализация полученных результатов в разрезе модулей:",
  },
  en: {
    titleMain: "SKILLS PASSPORT",
    titleSub: "COMPETENCY PASSPORT",
    competencyLabel: "for competency",
    signName: "A.V. KORABLEV",
    signRole1: "CHAIRMAN OF THE CLUSTER CREONOMYCA",
    signRole2: "Academician of St. Petersburg Engineering Academy",
    resultsTitle: "Achieved\nresults",
    totalLabel: "out of 100 points",
    skillSection: "Detailed score breakdown by skill group / WSSS:",
    moduleSection: "Detailed score breakdown by modules:",
  },
} as const

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    fontFamily: "Montserrat",
    paddingTop: 28,
    paddingBottom: 36,
    paddingHorizontal: 28,
  },
  topLogos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 28,
  },
  industryBrand: {
    position: "absolute",
    top: 26,
    right: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  industryBrandText: {
    color: colors.red,
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 0.95,
    textAlign: "right",
  },
  content: {
    marginTop: 18,
    flexDirection: "row",
    minHeight: 500,
    gap: 18,
  },
  leftCol: {
    width: 360,
    paddingTop: 8,
    paddingRight: 8,
  },
  divider: {
    width: 1,
    backgroundColor: colors.divider,
  },
  rightCol: {
    flex: 1,
    paddingTop: 6,
  },
  titleMain: {
    color: colors.red,
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 0.98,
  },
  titleSub: {
    marginTop: 4,
    color: colors.red,
    fontSize: 14,
    fontWeight: 400,
    textTransform: "uppercase",
  },
  person: {
    marginTop: 18,
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.22,
    color: colors.black,
  },
  organization: {
    marginTop: 8,
    fontSize: 11.5,
    lineHeight: 1.3,
    maxWidth: 280,
    color: colors.black,
  },
  eventBlock: {
    marginTop: 46,
    maxWidth: 270,
  },
  eventName: {
    color: colors.red,
    fontSize: 15,
    fontWeight: 700,
    lineHeight: 1.15,
  },
  competencyLabel: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: 500,
    color: colors.ink,
  },
  competencyPill: {
    marginTop: 8,
    backgroundColor: colors.red,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 38,
    justifyContent: "center",
  },
  competencyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.15,
  },
  date: {
    marginTop: 12,
    fontSize: 11,
    color: colors.ink,
  },
  signature: {
    marginTop: 44,
    maxWidth: 280,
  },
  signatureName: {
    fontSize: 12,
    fontWeight: 700,
    lineHeight: 1.15,
    color: colors.ink,
  },
  signatureRole: {
    marginTop: 3,
    fontSize: 9.5,
    fontWeight: 500,
    lineHeight: 1.2,
    color: colors.ink,
  },
  signatureLine: {
    marginTop: 26,
    width: 110,
    borderTopWidth: 1,
    borderTopColor: colors.softGray,
  },
  rightHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 10,
  },
  resultsTitle: {
    maxWidth: 150,
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.1,
    color: colors.black,
  },
  totalWrap: {
    alignItems: "flex-end",
    minWidth: 92,
  },
  totalValue: {
    color: colors.red,
    fontSize: 38,
    fontWeight: 700,
    lineHeight: 0.95,
  },
  totalLabel: {
    marginTop: 4,
    color: colors.nearBlack,
    fontSize: 10.5,
    fontWeight: 700,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 6,
    fontFamily: "Roboto",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1.25,
    color: colors.nearBlack,
  },
  rows: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    minHeight: 16,
    gap: 4,
  },
  rowPrefix: {
    width: 18,
    fontFamily: "Roboto",
    fontSize: 8.5,
    lineHeight: 1.1,
    color: colors.nearBlack,
  },
  rowLabel: {
    width: 186,
    fontFamily: "Roboto",
    fontSize: 8.5,
    lineHeight: 1.12,
    color: colors.nearBlack,
  },
  rowDotsWrap: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#9DA5AC",
    borderStyle: "dotted",
    marginBottom: 3,
    minWidth: 24,
  },
  rowScore: {
    width: 56,
    textAlign: "right",
    fontFamily: "Roboto",
    fontSize: 8.8,
    lineHeight: 1.1,
    color: colors.nearBlack,
  },
  rowScoreStrong: {
    fontWeight: 700,
  },
  bottomLogos: {
    marginTop: "auto",
    paddingTop: 18,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    flexWrap: "wrap",
  },
})

function formatScore(value: number, locale: PassportLocale) {
  if (!Number.isFinite(value)) return "0"
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  const formatted = rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  return locale === "ru" ? formatted.replace(".", ",") : formatted
}

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function buildWaveDots(cols: number, rows: number, width: number, height: number, reverse = false) {
  const dots: React.ReactNode[] = []

  for (let layer = 0; layer < 2; layer += 1) {
    const phase = layer === 0 ? 0 : 0.9
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const nx = col / Math.max(1, cols - 1)
        const ny = row / Math.max(1, rows - 1)
        const xNorm = reverse ? 1 - nx : nx
        const wave =
          Math.sin(xNorm * 12.4 - ny * 8.8 + phase) * 0.45 +
          Math.cos(xNorm * 7.2 + ny * 11.2 - phase) * 0.35 +
          Math.sin(xNorm * 15.8 - ny * 4.6 + phase * 1.2) * 0.2
        const intensity = Math.max(0, Math.min(1, (wave + 1) / 2))
        const fadeX = Math.max(0, 1 - Math.abs(xNorm - 0.5) / 0.62)
        const fadeY = Math.max(0, 1 - Math.abs(ny - 0.5) / 0.72)
        const alpha = (0.08 + intensity * 0.26) * fadeX * fadeY * (layer === 0 ? 1 : 0.7)
        const radius = 0.55 + intensity * (layer === 0 ? 1.45 : 1.05)
        const fill = intensity > 0.52 ? colors.waveDark : colors.waveLight

        dots.push(
          <Circle
            key={`${layer}-${row}-${col}`}
            cx={12 + (width - 24) * nx}
            cy={12 + (height - 24) * ny}
            r={radius}
            fill={fill}
            opacity={Number(alpha.toFixed(3))}
          />
        )
      }
    }
  }

  return dots
}

function LogoStrip({
  items,
  justify = "flex-start",
}: {
  items: ReadonlyArray<{ key: string; src: string; width: number; height: number }>
  justify?: "flex-start" | "center"
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: justify,
        gap: 14,
        flexWrap: "wrap",
      }}
    >
      {items.map((item) => (
        <Image
          key={item.key}
          src={item.src}
          style={{ width: item.width, height: item.height, objectFit: "contain" }}
        />
      ))}
    </View>
  )
}

function ScoreRows({
  items,
  locale,
  mode,
}: {
  items: ScoreRowData[]
  locale: PassportLocale
  mode: "skill" | "module"
}) {
  const normalizedItems = items.slice(0, mode === "skill" ? 9 : 6)

  return (
    <View style={styles.rows}>
      {normalizedItems.map((item, index) => {
        const prefix =
          mode === "module"
            ? `${String(item.code || String.fromCharCode(65 + index)).replace(/\.$/, "")}.`
            : `${Number(item.number ?? index + 1)}.`

        return (
          <View key={`${mode}-${prefix}-${index}`} style={styles.row}>
            <Text style={styles.rowPrefix}>{prefix}</Text>
            <Text style={styles.rowLabel}>{truncate(item.name || "-", 58)}</Text>
            <View style={styles.rowDotsWrap} />
            <Text style={styles.rowScore}>
              <Text style={styles.rowScoreStrong}>{formatScore(item.score ?? 0, locale)}</Text>
              /{formatScore(item.maxScore ?? 0, locale)}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export function SkillPassportDocument({ data }: { data: SkillPassportData }) {
  const locale = data.locale === "en" ? "en" : "ru"
  const text = copy[locale]
  const logos = logoSets[locale]
  const fullName = [data.participantName, data.participantMiddleName].filter(Boolean).join(" ").trim()
  const displayName = truncate(fullName.toUpperCase() || "-", 64)
  const organization = truncate(data.organization || "-", 110)
  const eventName = truncate(data.eventName || "-", 86)
  const competency = truncate((data.competency || "-").toUpperCase(), 48)
  const totalScore = formatScore(data.totalScore ?? 0, locale)
  const sortedSkillGroups = [...(data.skillGroups || [])].sort(
    (a, b) => Number(a.number ?? 0) - Number(b.number ?? 0)
  )
  const sortedModules = [...(data.modules || [])].sort((a, b) =>
    String(a.code || "").localeCompare(String(b.code || ""), "en", { numeric: true })
  )

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <Svg style={{ position: "absolute", top: 72, left: -70, width: 360, height: 210 }}>
          {buildWaveDots(28, 14, 360, 210)}
        </Svg>
        <Svg style={{ position: "absolute", right: -78, bottom: 34, width: 390, height: 220 }}>
          {buildWaveDots(30, 14, 390, 220, true)}
        </Svg>

        <LogoStrip items={logos.top} />

        <View style={styles.industryBrand}>
          <Text style={styles.industryBrandText}>Industry{"\n"}Skills</Text>
          <Image
            src={industryLogoSrc}
            style={{ width: 34, height: 34, objectFit: "contain" }}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.leftCol}>
            <Text style={styles.titleMain}>{text.titleMain}</Text>
            <Text style={styles.titleSub}>{text.titleSub}</Text>

            <Text style={styles.person}>{displayName}</Text>
            <Text style={styles.organization}>{organization}</Text>

            <View style={styles.eventBlock}>
              <Text style={styles.eventName}>{eventName}</Text>
              <Text style={styles.competencyLabel}>{text.competencyLabel}</Text>
              <View style={styles.competencyPill}>
                <Text style={styles.competencyText}>{competency}</Text>
              </View>
              <Text style={styles.date}>{data.dateRange || "-"}</Text>
            </View>

            <View style={styles.signature}>
              <Text style={styles.signatureName}>{text.signName}</Text>
              <Text style={styles.signatureRole}>{text.signRole1}</Text>
              <Text style={styles.signatureRole}>{text.signRole2}</Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.rightCol}>
            <View style={styles.rightHead}>
              <Text style={styles.resultsTitle}>{text.resultsTitle}</Text>
              <View style={styles.totalWrap}>
                <Text style={styles.totalValue}>{totalScore}</Text>
                <Text style={styles.totalLabel}>{text.totalLabel}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>{text.skillSection}</Text>
            <ScoreRows items={sortedSkillGroups} locale={locale} mode="skill" />

            <Text style={styles.sectionTitle}>{text.moduleSection}</Text>
            <ScoreRows items={sortedModules} locale={locale} mode="module" />
          </View>
        </View>

        <View style={styles.bottomLogos}>
          <LogoStrip items={logos.bottom} justify="center" />
        </View>
      </Page>
    </Document>
  )
}

export default SkillPassportDocument
