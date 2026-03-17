import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import puppeteer from "puppeteer-core"

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

const copy = {
  ru: {
    titleMain: "SKILLS PASSPORT",
    titleSub: "ПАСПОРТ КОМПЕТЕНЦИЙ",
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
    titleSub: "SKILL PASSPORT",
    competencyLabel: "for skill",
    signName: "A.V. KORABLEV",
    signRole1: "CHAIRMAN OF THE CLUSTER CREONOMYCA",
    signRole2: "Academician of St. Petersburg Engineering Academy",
    resultsTitle: "Achieved\nresults",
    totalLabel: "out of 100 points",
    skillSection: "Detailed score breakdown by skill group / WSSS:",
    moduleSection: "Detailed score breakdown by modules:",
  },
} as const

const backgroundSets = {
  ru: assetDataUrl("public", "templates", "passport-bg", "passport-background-ru.png"),
  en: assetDataUrl("public", "templates", "passport-bg", "passport-background-en.png"),
} as const
const industryLogoSrc = assetDataUrl("public", "templates", "passport-logos", "common", "industry-skills.png")

function assetUrl(...segments: string[]) {
  return pathToFileURL(path.join(process.cwd(), ...segments)).href
}

function assetDataUrl(...segments: string[]) {
  const filePath = path.join(process.cwd(), ...segments)
  const ext = path.extname(filePath).toLowerCase()
  const mimeType =
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    ext === ".svg" ? "image/svg+xml" :
    "application/octet-stream"
  const base64 = readFileSync(filePath).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function formatScore(value: number, locale: PassportLocale) {
  if (!Number.isFinite(value)) return "0"
  const rounded = Math.round(value * 100) / 100
  if (Number.isInteger(rounded)) return String(rounded)
  const formatted = rounded.toFixed(2).replace(/0+$/, "").replace(/\.$/, "")
  return locale === "ru" ? formatted.replace(".", ",") : formatted
}

function renderRows(items: ScoreRowData[], locale: PassportLocale, mode: "skill" | "module") {
  const normalizedItems = items.slice(0, mode === "skill" ? 9 : 6)
  return normalizedItems
    .map((item, index) => {
      const prefix =
        mode === "module"
          ? `${String(item.code || String.fromCharCode(65 + index)).replace(/\.$/, "")}.`
          : `${Number(item.number ?? index + 1)}.`

      return `
        <div class="row">
          <span class="row-prefix">${escapeHtml(prefix)}</span>
          <span class="row-label">${escapeHtml((item.name || "-").replace(/\s+/g, " ").trim())}</span>
          <span class="row-dots"></span>
          <span class="row-score"><strong>${escapeHtml(formatScore(item.score ?? 0, locale))}</strong>/${escapeHtml(formatScore(item.maxScore ?? 0, locale))}</span>
        </div>
      `
    })
    .join("")
}

function buildPassportHtml(data: SkillPassportData) {
  const locale = data.locale === "en" ? "en" : "ru"
  const text = copy[locale]
  const fullName = [data.participantName, data.participantMiddleName].filter(Boolean).join(" ").trim()
  const displayName = (fullName.toUpperCase() || "-").replace(/\s+/g, " ").trim()
  const organization = (data.organization || "-").replace(/\s+/g, " ").trim()
  const eventName = (data.eventName || "-").replace(/\s+/g, " ").trim()
  const competency = ((data.competency || "-").toUpperCase()).replace(/\s+/g, " ").trim()
  const totalScore = formatScore(data.totalScore ?? 0, locale)
  const backgroundSrc = backgroundSets[locale]
  const platformLabel = locale === "ru" ? "Платформа оценивания" : "Assessment Platform"
  const sortedSkillGroups = [...(data.skillGroups || [])].sort((a, b) => Number(a.number ?? 0) - Number(b.number ?? 0))
  const sortedModules = [...(data.modules || [])].sort((a, b) =>
    String(a.code || "").localeCompare(String(b.code || ""), "en", { numeric: true })
  )

  const montserratRegular = assetUrl("public", "fonts", "Montserrat-Regular.ttf")
  const montserratMedium = assetUrl("public", "fonts", "Montserrat-Medium.ttf")
  const montserratSemiBold = assetUrl("public", "fonts", "Montserrat-SemiBold.ttf")
  const montserratBold = assetUrl("public", "fonts", "Montserrat-Bold.ttf")
  const robotoRegular = assetUrl("public", "fonts", "Roboto-Regular.ttf")

  return `<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: A4 landscape; margin: 0; }
    @font-face { font-family: "Montserrat"; src: url("${montserratRegular}") format("truetype"); font-weight: 400; }
    @font-face { font-family: "Montserrat"; src: url("${montserratMedium}") format("truetype"); font-weight: 500; }
    @font-face { font-family: "Montserrat"; src: url("${montserratSemiBold}") format("truetype"); font-weight: 600; }
    @font-face { font-family: "Montserrat"; src: url("${montserratBold}") format("truetype"); font-weight: 700; }
    @font-face { font-family: "Roboto"; src: url("${robotoRegular}") format("truetype"); font-weight: 400; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: "Montserrat", Arial, sans-serif; }
    .passport {
      width: 297mm;
      height: 210mm;
      position: relative;
      overflow: hidden;
      padding: 28px 28px 34px;
      background: #fff;
      color: #000;
    }
    .passport-background {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 0;
    }
    .industry-brand {
      position: absolute;
      top: 22px;
      right: 26px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 2;
    }
    .industry-brand img {
      width: 38px;
      height: 38px;
      object-fit: contain;
      flex-shrink: 0;
    }
    .industry-brand-text {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      justify-content: space-between;
      min-height: 38px;
    }
    .industry-brand-title {
      color: #BE1622;
      font-size: 12px;
      font-weight: 800;
      line-height: .95;
      letter-spacing: .12em;
      text-align: right;
      text-transform: uppercase;
    }
    .industry-brand-subtitle {
      color: #64748b;
      font-size: 9px;
      font-weight: 500;
      line-height: 1;
      text-align: right;
    }
    .content {
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 360px 1px 1fr;
      gap: 18px;
      min-height: 500px;
      margin-top: 56px;
      padding-bottom: 76px;
    }
    .divider { background: #D5D9DE; }
    .left-col { padding-top: 8px; padding-right: 8px; }
    .right-col { padding-top: 6px; }
    .title-main { color: #BE1622; font-size: 32px; line-height: .98; font-weight: 700; margin: 0; }
    .title-sub { margin: 4px 0 0; color: #BE1622; font-size: 14px; font-weight: 400; text-transform: uppercase; }
    .person { margin-top: 18px; font-size: 16px; font-weight: 700; line-height: 1.22; }
    .organization { margin-top: 8px; font-size: 11.5px; line-height: 1.3; max-width: 280px; }
    .event-block { margin-top: 46px; max-width: 270px; }
    .event-name { color: #BE1622; font-size: 15px; font-weight: 700; line-height: 1.15; margin: 0; }
    .competency-label { margin: 10px 0 0; font-size: 13px; font-weight: 500; color: #010101; }
    .competency-pill { margin-top: 8px; background: #BE1622; border-radius: 4px; padding: 8px 12px; min-height: 38px; color: #fff; font-size: 16px; font-weight: 600; line-height: 1.15; }
    .date { margin-top: 12px; font-size: 11px; color: #010101; }
    .signature { margin-top: 44px; max-width: 280px; }
    .signature-name { font-size: 12px; font-weight: 700; line-height: 1.15; color: #010101; }
    .signature-role { margin-top: 3px; font-size: 9.5px; font-weight: 500; line-height: 1.2; color: #010101; }
    .signature-line { margin-top: 26px; width: 110px; border-top: 1px solid #8C8C8C; }
    .right-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 10px; }
    .results-title { max-width: 150px; font-size: 22px; font-weight: 700; line-height: 1.1; white-space: pre-line; margin: 0; }
    .total-wrap { text-align: right; min-width: 92px; }
    .total-value { color: #BE1622; font-size: 38px; font-weight: 700; line-height: .95; margin: 0; }
    .total-label { margin-top: 4px; color: #1E1E1E; font-size: 10.5px; font-weight: 700; }
    .section-title { margin: 8px 0 6px; font-family: "Roboto", Arial, sans-serif; font-size: 9px; font-weight: 700; line-height: 1.25; color: #1E1E1E; }
    .rows { display: grid; gap: 4px; }
    .row { display: grid; grid-template-columns: 18px 186px 1fr 56px; align-items: end; gap: 4px; min-height: 16px; font-family: "Roboto", Arial, sans-serif; }
    .row-prefix, .row-label, .row-score { font-size: 8.6px; line-height: 1.12; color: #1E1E1E; }
    .row-label { overflow-wrap: anywhere; }
    .row-dots { border-bottom: 1px dotted #9DA5AC; margin-bottom: 3px; min-width: 24px; }
    .row-score { text-align: right; }
    .row-score strong { font-weight: 700; }
  </style>
</head>
<body>
  <section class="passport">
    <img class="passport-background" src="${backgroundSrc}" alt="" />
    <div class="industry-brand">
      <img src="${industryLogoSrc}" alt="Industry Skills" />
      <div class="industry-brand-text">
        <div class="industry-brand-title">INDUSTRY<br />SKILLS</div>
        <div class="industry-brand-subtitle">${escapeHtml(platformLabel)}</div>
      </div>
    </div>

    <div class="content">
      <section class="left-col">
        <h1 class="title-main">${escapeHtml(text.titleMain)}</h1>
        <p class="title-sub">${escapeHtml(text.titleSub)}</p>

        <div class="person">${escapeHtml(displayName)}</div>
        <div class="organization">${escapeHtml(organization)}</div>

        <div class="event-block">
          <p class="event-name">${escapeHtml(eventName)}</p>
          <p class="competency-label">${escapeHtml(text.competencyLabel)}</p>
          <div class="competency-pill">${escapeHtml(competency)}</div>
          <div class="date">${escapeHtml(data.dateRange || "-")}</div>
        </div>

        <div class="signature">
          <div class="signature-name">${escapeHtml(text.signName)}</div>
          <div class="signature-role">${escapeHtml(text.signRole1)}</div>
          <div class="signature-role">${escapeHtml(text.signRole2)}</div>
          <div class="signature-line"></div>
        </div>
      </section>

      <div class="divider"></div>

      <section class="right-col">
        <div class="right-head">
          <h2 class="results-title">${escapeHtml(text.resultsTitle)}</h2>
          <div class="total-wrap">
            <p class="total-value">${escapeHtml(totalScore)}</p>
            <div class="total-label">${escapeHtml(text.totalLabel)}</div>
          </div>
        </div>

        <div class="section-title">${escapeHtml(text.skillSection)}</div>
        <div class="rows">${renderRows(sortedSkillGroups, locale, "skill")}</div>

        <div class="section-title">${escapeHtml(text.moduleSection)}</div>
        <div class="rows">${renderRows(sortedModules, locale, "module")}</div>
      </section>
    </div>
  </section>
</body>
</html>`
}

function findChromeExecutable() {
  const candidates = process.env.CHROME_BIN
    ? [process.env.CHROME_BIN]
    : process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : ["/usr/bin/chromium-browser", "/usr/bin/chromium", "/usr/bin/google-chrome"]

  const found = candidates.find((candidate) => candidate && path.isAbsolute(candidate) && existsSync(candidate))
  if (found) return found
  throw new Error("Chrome/Chromium executable not found")
}

export async function renderSkillPassportPdf(data: SkillPassportData): Promise<Uint8Array> {
  const tmpDir = await mkdtemp(path.join(tmpdir(), "skill-passport-"))
  const htmlPath = path.join(tmpDir, "passport.html")
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null

  try {
    await writeFile(htmlPath, buildPassportHtml(data), "utf8")

    browser = await puppeteer.launch({
      executablePath: findChromeExecutable(),
      headless: true,
      args: [
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    })

    const page = await browser.newPage()
    await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0", timeout: 15000 })
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await document.fonts.ready
      }

      await Promise.all(
        Array.from(document.images).map(async (image) => {
          if (!image.complete) {
            await new Promise<void>((resolve) => {
              image.addEventListener("load", () => resolve(), { once: true })
              image.addEventListener("error", () => resolve(), { once: true })
            })
          }

          if ("decode" in image) {
            try {
              await image.decode()
            } catch {
              // Ignore decode failures and let the browser render what it has.
            }
          }
        })
      )
    })

    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      displayHeaderFooter: false,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })

    return new Uint8Array(pdf)
  } finally {
    await browser?.close().catch(() => undefined)
    await rm(tmpDir, { recursive: true, force: true })
  }
}
