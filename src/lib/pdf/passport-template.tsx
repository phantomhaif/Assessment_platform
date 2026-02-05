import React from "react"
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Rect,
} from "@react-pdf/renderer"
import path from "path"

// Register fonts
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

const colors = {
  red: "#C41E3A",
  black: "#1a1a1a",
  gray: "#666666",
  lightGray: "#999999",
  dotGray: "#cccccc",
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#ffffff",
    fontFamily: "Roboto",
    paddingTop: 20,
    paddingBottom: 50,
    paddingHorizontal: 35,
  },
  // Header with logos
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  headerLogos: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 7,
    color: colors.gray,
    marginRight: 20,
  },
  // Main content - two columns
  mainContent: {
    flexDirection: "row",
  },
  leftColumn: {
    width: "40%",
    paddingRight: 15,
  },
  rightColumn: {
    width: "60%",
    paddingLeft: 15,
  },
  // Left column styles
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: colors.red,
    letterSpacing: 1,
    marginBottom: 0,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.red,
    letterSpacing: 0.5,
    marginBottom: 15,
  },
  participantName: {
    fontSize: 13,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 3,
  },
  organization: {
    fontSize: 10,
    color: colors.black,
    marginBottom: 20,
    lineHeight: 1.4,
  },
  eventName: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.red,
    marginBottom: 6,
  },
  competencyLabel: {
    fontSize: 9,
    color: colors.black,
    marginBottom: 5,
  },
  competencyBox: {
    backgroundColor: colors.red,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  competencyText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#ffffff",
  },
  dateText: {
    fontSize: 10,
    color: colors.black,
    marginBottom: 20,
  },
  // Chairman section
  chairmanSection: {
    marginTop: 15,
  },
  chairmanName: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.black,
    marginBottom: 3,
  },
  chairmanTitle: {
    fontSize: 8,
    color: colors.black,
    marginBottom: 1,
    lineHeight: 1.3,
  },
  signatureLine: {
    width: 150,
    borderBottomWidth: 1,
    borderBottomColor: colors.dotGray,
    marginTop: 20,
  },
  // Right column styles
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.black,
    lineHeight: 1.2,
  },
  scoreContainer: {
    alignItems: "flex-end",
  },
  totalScore: {
    fontSize: 32,
    fontWeight: "bold",
    color: colors.red,
  },
  maxScoreText: {
    fontSize: 8,
    color: colors.black,
    marginTop: -2,
  },
  // Section styles
  sectionTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.red,
    marginBottom: 6,
    marginTop: 3,
  },
  // Skill/Module row
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
    height: 14,
  },
  itemNumber: {
    fontSize: 7.5,
    color: colors.black,
    width: 12,
  },
  itemText: {
    fontSize: 7.5,
    color: colors.black,
    width: 180,
  },
  dotsContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 3,
    overflow: "hidden",
  },
  dotText: {
    fontSize: 7,
    color: colors.dotGray,
    letterSpacing: 1,
  },
  barIconContainer: {
    marginRight: 4,
  },
  itemScoreContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    minWidth: 35,
    justifyContent: "flex-end",
  },
  itemScoreValue: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.black,
  },
  itemScoreMax: {
    fontSize: 8,
    color: colors.black,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 15,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7,
    color: colors.gray,
    marginHorizontal: 15,
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

function formatScore(score: number): string {
  if (Number.isInteger(score)) {
    return score.toString()
  }
  return score.toFixed(2).replace(".", ",")
}

// Simple bar chart icon component
function BarChartIcon() {
  return (
    <Svg width={10} height={8} viewBox="0 0 24 24">
      <Rect x="4" y="14" width="4" height="10" fill={colors.lightGray} />
      <Rect x="10" y="8" width="4" height="16" fill={colors.lightGray} />
      <Rect x="16" y="4" width="4" height="20" fill={colors.lightGray} />
    </Svg>
  )
}

export function SkillPassportDocument({ data }: { data: PassportData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header with logos */}
        <View style={styles.header}>
          <View style={styles.headerLogos}>
            <Text style={styles.logoText}>КРЕОНОМИКА</Text>
            <Text style={styles.logoText}>ЦИТБ</Text>
            <Text style={styles.logoText}>R-Про</Text>
          </View>
        </View>

        {/* Main two-column layout */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            <Text style={styles.title}>SKILLS PASSPORT</Text>
            <Text style={styles.subtitle}>ПАСПОРТ КОМПЕТЕНЦИЙ</Text>

            <Text style={styles.participantName}>{data.participantName}</Text>

            <Text style={styles.organization}>{data.organization}</Text>

            <Text style={styles.eventName}>{data.eventName}</Text>

            <Text style={styles.competencyLabel}>по компетенции</Text>
            <View style={styles.competencyBox}>
              <Text style={styles.competencyText}>{data.competency}</Text>
            </View>

            <Text style={styles.dateText}>{data.dateRange}</Text>

            {/* Chairman section */}
            <View style={styles.chairmanSection}>
              <Text style={styles.chairmanName}>А.В. КОРАБЛЕВ</Text>
              <Text style={styles.chairmanTitle}>
                Председатель правления Кластера «Креономика»
              </Text>
              <Text style={styles.chairmanTitle}>
                Академик Санкт-Петербургской Инженерной Академии
              </Text>
              <View style={styles.signatureLine} />
            </View>
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Results header with score */}
            <View style={styles.resultsHeader}>
              <View>
                <Text style={styles.resultsTitle}>Полученные</Text>
                <Text style={styles.resultsTitle}>результаты</Text>
              </View>
              <View style={styles.scoreContainer}>
                <Text style={styles.totalScore}>{formatScore(data.totalScore)}</Text>
                <Text style={styles.maxScoreText}>из 100 баллов</Text>
              </View>
            </View>

            {/* Skill groups section */}
            <Text style={styles.sectionTitle}>
              Детализация полученных результатов в разрезе группы навыков / WSSS:
            </Text>

            {data.skillGroups.map((group, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemNumber}>{group.number}.</Text>
                <Text style={styles.itemText}>{group.name}</Text>
                <View style={styles.dotsContainer}>
                  <Text style={styles.dotText}>..............................</Text>
                </View>
                <View style={styles.barIconContainer}>
                  <BarChartIcon />
                </View>
                <View style={styles.itemScoreContainer}>
                  <Text style={styles.itemScoreValue}>{formatScore(group.score)}</Text>
                  <Text style={styles.itemScoreMax}>/{formatScore(group.maxScore)}</Text>
                </View>
              </View>
            ))}

            {/* Modules section */}
            <Text style={[styles.sectionTitle, { marginTop: 8 }]}>
              Детализация полученных результатов в разрезе модулей:
            </Text>

            {data.modules.map((module, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemNumber}>{module.code}.</Text>
                <Text style={styles.itemText}>{module.name}</Text>
                <View style={styles.dotsContainer}>
                  <Text style={styles.dotText}>..............................</Text>
                </View>
                <View style={styles.barIconContainer}>
                  <BarChartIcon />
                </View>
                <View style={styles.itemScoreContainer}>
                  <Text style={styles.itemScoreValue}>{formatScore(module.score)}</Text>
                  <Text style={styles.itemScoreMax}>/{formatScore(module.maxScore)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Footer with partner logos */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>R-PRO DIGITAL</Text>
          <Text style={styles.footerText}>R-Pro</Text>
          <Text style={styles.footerText}>РобоКомпонент</Text>
          <Text style={styles.footerText}>PICASO 3D</Text>
        </View>
      </Page>
    </Document>
  )
}
