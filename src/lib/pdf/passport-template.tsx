import React from "react"
import {
  Document,
  Page,
  Path,
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
  decoFill: "#D9E0E8",
  decoStroke: "#D0D7DE",
  decoStrokeLight: "#E1E6EB",
}

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
    topLogos: ["КРЕОНОМИКА", "ЦИТБ", "R-ПРО"],
    bottomLogos: ["R-PRO DIGITAL", "R-Pro Robotics", "РобоКомпонент", "PICASO 3D", "ВЭБ Робототехника"],
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
    topLogos: ["CREONOMYCA", "IITB", "R-PRO"],
    bottomLogos: ["R-PRO DIGITAL", "R-Pro Robotics", "RoboKomponent", "PICASO 3D", "WEB Robotics"],
  },
} as const

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    fontFamily: "Montserrat",
    paddingTop: 28,
    paddingBottom: 34,
    paddingHorizontal: 28,
  },
  leftDecoration: {
    position: "absolute",
    top: 96,
    left: -54,
    width: 230,
    height: 380,
  },
  rightDecoration: {
    position: "absolute",
    right: -54,
    bottom: 20,
    width: 240,
    height: 390,
  },
  topLogos: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    minHeight: 28,
  },
  topLogoItem: {
    fontSize: 8.8,
    fontWeight: 600,
    color: colors.gray,
    letterSpacing: 0.25,
  },
  industryBrand: {
    position: "absolute",
    top: 24,
    right: 30,
    alignItems: "flex-end",
  },
  industryBrandText: {
    color: colors.red,
    fontSize: 15,
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
  rowDots: {
    flex: 1,
    marginBottom: 3,
    minWidth: 24,
    fontFamily: "Roboto",
    fontSize: 7.5,
    lineHeight: 1,
    color: "#9DA5AC",
    letterSpacing: 0.8,
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
  bottomLogoItem: {
    fontSize: 8.4,
    fontWeight: 600,
    color: colors.gray,
    letterSpacing: 0.2,
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

function DotLeader() {
  return <Text style={styles.rowDots}>....................................</Text>
}

function LeftDecoration() {
  return (
    <Svg style={styles.leftDecoration} viewBox="0 0 230 380">
      <Path
        d="M0 0 C140 20 176 140 72 214 C12 256 6 322 106 380 L0 380 Z"
        fill={colors.decoFill}
        fillOpacity={0.24}
      />
      <Path
        d="M8 22 C128 46 154 154 70 210 C22 246 26 302 96 354"
        stroke={colors.decoStroke}
        strokeOpacity={0.5}
        strokeWidth={10}
        fill="none"
      />
      <Path
        d="M44 2 C156 34 194 166 102 238 C62 274 68 326 136 380"
        stroke={colors.decoStrokeLight}
        strokeOpacity={0.6}
        strokeWidth={12}
        fill="none"
      />
    </Svg>
  )
}

function RightDecoration() {
  return (
    <Svg style={styles.rightDecoration} viewBox="0 0 240 390">
      <Path
        d="M240 0 C96 22 60 148 166 224 C226 270 232 332 126 390 L240 390 Z"
        fill={colors.decoFill}
        fillOpacity={0.24}
      />
      <Path
        d="M230 24 C110 48 86 156 170 214 C216 250 214 306 144 358"
        stroke={colors.decoStroke}
        strokeOpacity={0.5}
        strokeWidth={10}
        fill="none"
      />
      <Path
        d="M194 0 C84 32 44 170 136 244 C176 282 170 334 104 388"
        stroke={colors.decoStrokeLight}
        strokeOpacity={0.6}
        strokeWidth={12}
        fill="none"
      />
    </Svg>
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
            <DotLeader />
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
        <LeftDecoration />
        <RightDecoration />

        <View style={styles.topLogos}>
          {text.topLogos.map((item) => (
            <Text key={item} style={styles.topLogoItem}>
              {item}
            </Text>
          ))}
        </View>

        <View style={styles.industryBrand}>
          <Text style={styles.industryBrandText}>Industry{"\n"}Skills</Text>
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
          {text.bottomLogos.map((item) => (
            <Text key={item} style={styles.bottomLogoItem}>
              {item}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export default SkillPassportDocument
