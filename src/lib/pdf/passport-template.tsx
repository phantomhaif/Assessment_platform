import React from "react"
import {
  Document,
  Font,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer"
import path from "path"

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: path.join(process.cwd(), "public/fonts/Roboto-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
})

Font.register({
  family: "Montserrat",
  fonts: [
    {
      src: path.join(process.cwd(), "public/fonts/Montserrat-Regular.ttf"),
      fontWeight: "normal",
    },
    {
      src: path.join(process.cwd(), "public/fonts/Montserrat-Medium.ttf"),
      fontWeight: 500,
    },
    {
      src: path.join(process.cwd(), "public/fonts/Montserrat-SemiBold.ttf"),
      fontWeight: 600,
    },
    {
      src: path.join(process.cwd(), "public/fonts/Montserrat-Bold.ttf"),
      fontWeight: "bold",
    },
  ],
})

const RU = {
  topLogoCreonomika: "\u041a\u0420\u0415\u041e\u041d\u041e\u041c\u0418\u041a\u0410",
  topLogoCITB: "\u0426\u0418\u0422\u0411",
  topLogoRPro: "R-\u041f\u0420\u041e",
  roboComponent: "\u0420\u043e\u0431\u043e\u041a\u043e\u043c\u043f\u043e\u043d\u0435\u043d\u0442",
  subtitle: "\u041f\u0410\u0421\u041f\u041e\u0420\u0422 \u041a\u041e\u041c\u041f\u0415\u0422\u0415\u041d\u0426\u0418\u0419",
  competencyLabel: "\u043f\u043e \u043a\u043e\u043c\u043f\u0435\u0442\u0435\u043d\u0446\u0438\u0438",
  signatureName: "\u0410.\u0412. \u041a\u041e\u0420\u0410\u0411\u041b\u0415\u0412",
  signatureRole1: "\u041f\u0440\u0435\u0434\u0441\u0435\u0434\u0430\u0442\u0435\u043b\u044c \u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u044f \u041a\u043b\u0430\u0441\u0442\u0435\u0440\u0430 \u00ab\u041a\u0440\u0435\u043e\u043d\u043e\u043c\u0438\u043a\u0430\u00bb",
  signatureRole2: "\u0410\u043a\u0430\u0434\u0435\u043c\u0438\u043a \u0421\u0430\u043d\u043a\u0442-\u041f\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433\u0441\u043a\u043e\u0439 \u0418\u043d\u0436\u0435\u043d\u0435\u0440\u043d\u043e\u0439 \u0410\u043a\u0430\u0434\u0435\u043c\u0438\u0438",
  rightTitle: "\u041f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u044b\u0435\n\u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u044b",
  totalScoreLabel: "\u0438\u0437 100 \u0431\u0430\u043b\u043b\u043e\u0432",
  skillSectionTitle:
    "\u0414\u0435\u0442\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u044b\u0445 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432 \u0432 \u0440\u0430\u0437\u0440\u0435\u0437\u0435 \u0433\u0440\u0443\u043f\u043f\u044b \u043d\u0430\u0432\u044b\u043a\u043e\u0432 / WSSS:",
  moduleSectionTitle:
    "\u0414\u0435\u0442\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f \u043f\u043e\u043b\u0443\u0447\u0435\u043d\u043d\u044b\u0445 \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442\u043e\u0432 \u0432 \u0440\u0430\u0437\u0440\u0435\u0437\u0435 \u043c\u043e\u0434\u0443\u043b\u0435\u0439:",
}

const colors = {
  red: "#BE1622",
  black: "#000000",
  nearBlack: "#1E1E1E",
  ink: "#010101",
  gray: "#7E878F",
  graySoft: "#8C8C8C",
  divider: "#D5D9DE",
  chipBorder: "#D6DCE1",
}

const TOP_LOGOS = [RU.topLogoCreonomika, RU.topLogoCITB, RU.topLogoRPro]
const BOTTOM_LOGOS = ["R-PRO DIGITAL", "R-Pro", RU.roboComponent, "PICASO 3D"]
const DOT_LEADER = ".".repeat(44)

const styles = StyleSheet.create({
  page: {
    position: "relative",
    backgroundColor: "#FFFFFF",
    fontFamily: "Montserrat",
    padding: 0,
  },
  leftDecoration: {
    position: "absolute",
    top: 126,
    left: -48,
    width: 220,
    height: 420,
  },
  rightDecoration: {
    position: "absolute",
    top: 126,
    right: -48,
    width: 220,
    height: 420,
  },
  topLogoRow: {
    position: "absolute",
    top: 35,
    left: 34,
    flexDirection: "row",
    alignItems: "center",
  },
  topLogoItem: {
    marginRight: 18,
  },
  topLogoText: {
    fontFamily: "Montserrat",
    fontWeight: 600,
    fontSize: 9,
    color: colors.gray,
    letterSpacing: 0.15,
  },
  topLogoTextSmall: {
    fontSize: 8.4,
  },
  leftColumn: {
    position: "absolute",
    left: 38,
    top: 99,
    width: 390,
  },
  rightColumn: {
    position: "absolute",
    left: 497,
    top: 100,
    width: 309,
  },
  divider: {
    position: "absolute",
    left: 477,
    top: 86,
    bottom: 86,
    width: 1,
    backgroundColor: colors.divider,
  },
  title: {
    fontFamily: "Montserrat",
    fontSize: 36,
    fontWeight: "bold",
    color: colors.red,
    letterSpacing: 0,
  },
  subtitle: {
    marginTop: 2,
    fontFamily: "Montserrat",
    fontSize: 16,
    fontWeight: "normal",
    color: colors.red,
  },
  participantName: {
    marginTop: 18,
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.black,
  },
  organization: {
    marginTop: 8,
    width: 368,
    fontFamily: "Montserrat",
    fontSize: 11,
    fontWeight: "normal",
    color: colors.black,
    lineHeight: 1.25,
  },
  eventBlock: {
    marginTop: 50,
    width: 280,
  },
  eventName: {
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.red,
    lineHeight: 1.2,
  },
  competencyLabel: {
    marginTop: 8,
    fontFamily: "Montserrat",
    fontSize: 14,
    fontWeight: 500,
    color: colors.ink,
  },
  competencyBadge: {
    marginTop: 8,
    width: 280,
    minHeight: 34,
    borderRadius: 3,
    backgroundColor: colors.red,
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  competencyText: {
    fontFamily: "Montserrat",
    fontSize: 18,
    fontWeight: 600,
    color: "#FFFFFF",
    lineHeight: 1.1,
  },
  dateText: {
    marginTop: 12,
    fontFamily: "Montserrat",
    fontSize: 11,
    fontWeight: "normal",
    color: colors.ink,
  },
  signatureBlock: {
    marginTop: 40,
    width: 310,
  },
  signatureName: {
    fontFamily: "Montserrat",
    fontWeight: "bold",
    fontSize: 12.7,
    color: colors.ink,
    lineHeight: 1.1,
  },
  signatureRole: {
    marginTop: 3,
    fontFamily: "Montserrat",
    fontWeight: 500,
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.2,
  },
  signatureLine: {
    marginTop: 12,
    width: 116.5,
    borderBottomWidth: 1,
    borderBottomColor: colors.graySoft,
  },
  rightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rightTitle: {
    width: 186,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    fontSize: 20,
    lineHeight: 1.25,
    color: colors.black,
  },
  totalScoreBlock: {
    width: 95,
    alignItems: "flex-end",
  },
  totalScore: {
    fontFamily: "Montserrat",
    fontWeight: "bold",
    fontSize: 36,
    color: colors.red,
    lineHeight: 1,
  },
  totalScoreLabel: {
    marginTop: 2,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    fontSize: 12,
    color: colors.nearBlack,
  },
  sectionTitle: {
    marginTop: 10,
    marginBottom: 6,
    fontFamily: "Roboto",
    fontWeight: "bold",
    fontSize: 9,
    color: colors.nearBlack,
    lineHeight: 1.25,
  },
  moduleSectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontFamily: "Roboto",
    fontWeight: "bold",
    fontSize: 9,
    color: colors.nearBlack,
    lineHeight: 1.25,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowPrefix: {
    width: 16,
    fontFamily: "Roboto",
    fontSize: 8.5,
    color: colors.nearBlack,
  },
  rowLabel: {
    width: 206,
    fontFamily: "Roboto",
    fontSize: 8.5,
    color: colors.nearBlack,
    lineHeight: 1.18,
  },
  rowDotsWrap: {
    flex: 1,
    marginHorizontal: 4,
    overflow: "hidden",
  },
  rowDots: {
    fontFamily: "Roboto",
    fontSize: 8,
    color: colors.gray,
    letterSpacing: 0.5,
  },
  rowScoreWrap: {
    width: 47,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "baseline",
  },
  rowScoreValue: {
    fontFamily: "Roboto",
    fontWeight: "bold",
    fontSize: 9,
    color: colors.nearBlack,
  },
  rowScoreMax: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: colors.nearBlack,
  },
  bottomLogoRow: {
    position: "absolute",
    bottom: 51,
    left: 196,
    width: 430,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bottomLogoText: {
    fontFamily: "Montserrat",
    fontWeight: 600,
    fontSize: 8.4,
    color: colors.gray,
    letterSpacing: 0.2,
  },
})

interface PassportData {
  participantName: string
  participantMiddleName?: string
  organization: string
  eventName: string
  competency: string
  dateRange: string
  totalScore: number
  skillGroups: Array<{
    number: number
    name: string
    score: number
    maxScore: number
  }>
  modules: Array<{
    code: string
    name: string
    score: number
    maxScore: number
  }>
}

interface ScoreRowProps {
  prefix: string
  label: string
  score: number
  maxScore: number
  height: number
}

function formatScore(score: number): string {
  if (!Number.isFinite(score)) return "0"
  const rounded = Math.round(score * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toString()
  return rounded.toFixed(2).replace(".", ",")
}

function clampText(value: string, maxLength: number): string {
  const text = value?.trim() || ""
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 3).trimEnd()}...`
}

function ScoreRow({ prefix, label, score, maxScore, height }: ScoreRowProps) {
  return (
    <View style={[styles.scoreRow, { height }]}>
      <Text style={styles.rowPrefix}>{prefix}</Text>
      <Text style={styles.rowLabel}>{clampText(label, 64)}</Text>
      <View style={styles.rowDotsWrap}>
        <Text style={styles.rowDots}>{DOT_LEADER}</Text>
      </View>
      <View style={styles.rowScoreWrap}>
        <Text style={styles.rowScoreValue}>{formatScore(score)}</Text>
        <Text style={styles.rowScoreMax}>/{formatScore(maxScore)}</Text>
      </View>
    </View>
  )
}

function LeftDecoration() {
  return (
    <Svg style={styles.leftDecoration} viewBox="0 0 220 420">
      <Path
        d="M0 0 C135 22 166 168 52 240 C-18 286 0 354 106 420 L0 420 Z"
        fill="#D9E0E8"
        fillOpacity={0.26}
      />
      <Path
        d="M6 28 C126 52 144 176 52 230 C-5 266 4 336 94 392"
        stroke="#D0D7DE"
        strokeOpacity={0.48}
        strokeWidth={10}
        fill="none"
      />
      <Path
        d="M42 0 C160 34 192 182 94 264 C44 306 56 358 136 420"
        stroke="#E1E6EB"
        strokeOpacity={0.55}
        strokeWidth={12}
        fill="none"
      />
    </Svg>
  )
}

function RightDecoration() {
  return (
    <Svg style={styles.rightDecoration} viewBox="0 0 220 420">
      <Path
        d="M220 0 C85 22 54 168 168 240 C238 286 220 354 114 420 L220 420 Z"
        fill="#D9E0E8"
        fillOpacity={0.26}
      />
      <Path
        d="M214 28 C94 52 76 176 168 230 C225 266 216 336 126 392"
        stroke="#D0D7DE"
        strokeOpacity={0.48}
        strokeWidth={10}
        fill="none"
      />
      <Path
        d="M178 0 C60 34 28 182 126 264 C176 306 164 358 84 420"
        stroke="#E1E6EB"
        strokeOpacity={0.55}
        strokeWidth={12}
        fill="none"
      />
    </Svg>
  )
}

export function SkillPassportDocument({ data }: { data: PassportData }) {
  const participantFullName = clampText(
    [data.participantName, data.participantMiddleName].filter(Boolean).join(" ").trim(),
    62
  )

  const sortedSkillGroups = [...(data.skillGroups || [])].sort((a, b) => a.number - b.number)
  const sortedModules = [...(data.modules || [])].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), "en", { numeric: true })
  )

  const skillRowHeight = Math.max(
    16,
    Math.min(21, 188 / Math.max(1, sortedSkillGroups.length))
  )
  const moduleRowHeight = Math.max(
    15,
    Math.min(22, 88 / Math.max(1, sortedModules.length))
  )

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <LeftDecoration />
        <RightDecoration />

        <View style={styles.topLogoRow}>
          {TOP_LOGOS.map((logo, index) => (
            <View key={logo} style={styles.topLogoItem}>
              <Text style={[styles.topLogoText, index === 1 && styles.topLogoTextSmall]}>
                {logo}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.leftColumn}>
          <Text style={styles.title}>SKILLS PASSPORT</Text>
          <Text style={styles.subtitle}>{RU.subtitle}</Text>

          <Text style={styles.participantName}>{participantFullName || "-"}</Text>
          <Text style={styles.organization}>{clampText(data.organization || "-", 90)}</Text>

          <View style={styles.eventBlock}>
            <Text style={styles.eventName}>{clampText(data.eventName || "-", 44)}</Text>
            <Text style={styles.competencyLabel}>{RU.competencyLabel}</Text>
            <View style={styles.competencyBadge}>
              <Text style={styles.competencyText}>{clampText(data.competency || "-", 34)}</Text>
            </View>
            <Text style={styles.dateText}>{data.dateRange || "-"}</Text>
          </View>

          <View style={styles.signatureBlock}>
            <Text style={styles.signatureName}>{RU.signatureName}</Text>
            <Text style={styles.signatureRole}>{RU.signatureRole1}</Text>
            <Text style={styles.signatureRole}>{RU.signatureRole2}</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>

        <View style={styles.rightColumn}>
          <View style={styles.rightHeader}>
            <Text style={styles.rightTitle}>{RU.rightTitle}</Text>
            <View style={styles.totalScoreBlock}>
              <Text style={styles.totalScore}>{formatScore(data.totalScore)}</Text>
              <Text style={styles.totalScoreLabel}>{RU.totalScoreLabel}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>{RU.skillSectionTitle}</Text>

          {sortedSkillGroups.map((group, index) => (
            <ScoreRow
              key={`group-${group.number}-${index}`}
              prefix={`${group.number}.`}
              label={group.name}
              score={group.score}
              maxScore={group.maxScore}
              height={skillRowHeight}
            />
          ))}

          <Text style={styles.moduleSectionTitle}>{RU.moduleSectionTitle}</Text>

          {sortedModules.map((module, index) => {
            const moduleCode = String(module.code || index + 1).trim()
            const prefix = moduleCode.endsWith(".") ? moduleCode : `${moduleCode}.`
            return (
              <ScoreRow
                key={`module-${moduleCode}-${index}`}
                prefix={prefix}
                label={module.name}
                score={module.score}
                maxScore={module.maxScore}
                height={moduleRowHeight}
              />
            )
          })}
        </View>

        <View style={styles.bottomLogoRow}>
          {BOTTOM_LOGOS.map((logo) => (
            <Text key={logo} style={styles.bottomLogoText}>
              {logo}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  )
}
