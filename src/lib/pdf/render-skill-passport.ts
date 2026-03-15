import { execFile } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)

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

const logoSets = {
  ru: {
    top: [
      { key: "creonomika", src: assetUrl("public", "templates", "passport-logos", "ru", "creonomika.png"), alt: "Креономика" },
      { key: "iitb", src: assetUrl("public", "templates", "passport-logos", "ru", "iitb.png"), alt: "ЦИТБ" },
      { key: "rpro-concern", src: assetUrl("public", "templates", "passport-logos", "ru", "rpro-concern.png"), alt: "R-ПРО" },
    ],
    bottom: [
      { key: "rpds", src: assetUrl("public", "templates", "passport-logos", "ru", "rpds.png"), alt: "R-PRO DIGITAL" },
      { key: "rpro-robotics", src: assetUrl("public", "templates", "passport-logos", "ru", "rpro-robotics.png"), alt: "R-Pro Robotics" },
      { key: "robocomponent", src: assetUrl("public", "templates", "passport-logos", "ru", "robocomponent.png"), alt: "РобоКомпонент" },
      { key: "picaso", src: assetUrl("public", "templates", "passport-logos", "ru", "picaso.png"), alt: "PICASO 3D" },
      { key: "vdn", src: assetUrl("public", "templates", "passport-logos", "ru", "vdn-clean.png"), alt: "ВЭБ Робототехника" },
    ],
  },
  en: {
    top: [
      { key: "creonomika", src: assetUrl("public", "templates", "passport-logos", "en", "creonomika.png"), alt: "Creonomyca" },
      { key: "iitb", src: assetUrl("public", "templates", "passport-logos", "en", "iitb.png"), alt: "IITB" },
      { key: "rpro-concern", src: assetUrl("public", "templates", "passport-logos", "en", "rpro-concern.png"), alt: "R-PRO" },
    ],
    bottom: [
      { key: "rpds", src: assetUrl("public", "templates", "passport-logos", "en", "rpds.png"), alt: "R-PRO DIGITAL" },
      { key: "rpro-robotics", src: assetUrl("public", "templates", "passport-logos", "en", "rpro-robotics.png"), alt: "R-Pro Robotics" },
      { key: "robocomponent", src: assetUrl("public", "templates", "passport-logos", "en", "robocomponent.png"), alt: "RoboKomponent" },
      { key: "picaso", src: assetUrl("public", "templates", "passport-logos", "en", "picaso.png"), alt: "PICASO 3D" },
      { key: "vdn", src: assetUrl("public", "templates", "passport-logos", "en", "vdn-clean.png"), alt: "WEB Robotics" },
    ],
  },
} as const

const industryLogoSrc = assetUrl("public", "templates", "passport-logos", "common", "industry-skills.png")

function assetUrl(...segments: string[]) {
  return pathToFileURL(path.join(process.cwd(), ...segments)).href
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

function truncate(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function blendHex(a: string, b: string, t: number) {
  const ah = a.replace("#", "")
  const bh = b.replace("#", "")
  const ar = parseInt(ah.slice(0, 2), 16)
  const ag = parseInt(ah.slice(2, 4), 16)
  const ab = parseInt(ah.slice(4, 6), 16)
  const br = parseInt(bh.slice(0, 2), 16)
  const bg = parseInt(bh.slice(2, 4), 16)
  const bb = parseInt(bh.slice(4, 6), 16)
  const rr = Math.round(ar + (br - ar) * t)
  const rg = Math.round(ag + (bg - ag) * t)
  const rb = Math.round(ab + (bb - ab) * t)
  return `rgb(${rr},${rg},${rb})`
}

function createWaveSvg(reverse = false) {
  const cols = 58
  const rows = 26
  const spacingX = 18
  const spacingY = 16
  const width = cols * spacingX
  const height = rows * spacingY
  let circles = ""

  for (let layer = 0; layer < 2; layer += 1) {
    const phase = layer === 0 ? 0 : 1.08
    const offsetX = layer === 0 ? 0 : 1.1
    const offsetY = layer === 0 ? 0 : 0.9
    const layerOpacity = layer === 0 ? 1 : 0.62
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const nx = col / (cols - 1)
        const ny = row / (rows - 1)
        const xNorm = reverse ? 1 - nx : nx
        const x = col * spacingX + spacingX / 2 + offsetX
        const y = row * spacingY + spacingY / 2 + offsetY
        const w1 = Math.sin(xNorm * 12.6 - ny * 9.3 + phase)
        const w2 = Math.cos(xNorm * 8.1 + ny * 10.7 - phase * 0.7)
        const w3 = Math.sin(xNorm * 17.2 - ny * 4.4 + phase * 1.4)
        const interference = (w1 * 0.5 + w2 * 0.34 + w3 * 0.16 + 1) / 2
        const edgeX = 1 - Math.pow(Math.abs(xNorm - 0.52) / 0.55, 1.45)
        const edgeY = 1 - Math.pow(Math.abs(ny - 0.5) / 0.68, 1.35)
        const fade = Math.max(0, edgeX) * Math.max(0, edgeY)
        const shimmer = Math.max(0, Math.min(1, interference * 0.78 + fade * 0.22))
        const radius = (0.42 + shimmer * (layer === 0 ? 1.85 : 1.25)).toFixed(3)
        const opacity = ((0.035 + shimmer * 0.285) * layerOpacity).toFixed(3)
        const fill = blendHex("#c8d2dd", "#6f8297", shimmer * (layer === 0 ? 1 : 0.85))
        circles += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${radius}" fill="${fill}" opacity="${opacity}" />`
      }
    }
  }

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${circles}</svg>`
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
          <span class="row-label">${escapeHtml(truncate(item.name || "-", 58))}</span>
          <span class="row-dots"></span>
          <span class="row-score"><strong>${escapeHtml(formatScore(item.score ?? 0, locale))}</strong>/${escapeHtml(formatScore(item.maxScore ?? 0, locale))}</span>
        </div>
      `
    })
    .join("")
}

function renderLogoStrip(items: ReadonlyArray<{ key: string; src: string; alt: string }>, type: "top" | "bottom") {
  return items
    .map(
      (item) => `
        <span class="logo-item logo-${type}" data-key="${escapeHtml(item.key)}">
          <img src="${item.src}" alt="${escapeHtml(item.alt)}" />
        </span>
      `
    )
    .join("")
}

function buildPassportHtml(data: SkillPassportData) {
  const locale = data.locale === "en" ? "en" : "ru"
  const text = copy[locale]
  const logos = logoSets[locale]
  const fullName = [data.participantName, data.participantMiddleName].filter(Boolean).join(" ").trim()
  const displayName = truncate(fullName.toUpperCase() || "-", 64)
  const organization = truncate(data.organization || "-", 110)
  const eventName = truncate(data.eventName || "-", 86)
  const competency = truncate((data.competency || "-").toUpperCase(), 48)
  const totalScore = formatScore(data.totalScore ?? 0, locale)
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
    .industry-brand {
      position: absolute;
      top: 24px;
      right: 30px;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #BE1622;
      font-weight: 700;
      font-size: 15px;
      line-height: .95;
      text-align: right;
      z-index: 2;
    }
    .industry-brand img { width: 34px; height: 34px; object-fit: contain; }
    .bg-wave { position: absolute; pointer-events: none; opacity: .88; overflow: hidden; }
    .wave-left { top: 66px; left: -86px; width: 510px; height: 270px; }
    .wave-right { right: -86px; bottom: 28px; width: 560px; height: 290px; transform: scaleX(-1); }
    .bg-wave svg { width: 100%; height: 100%; display: block; }
    .logos-top,.logos-bottom,.content { position: relative; z-index: 1; }
    .logos-top,.logos-bottom { display:flex; align-items:center; flex-wrap:wrap; gap: 12px 18px; }
    .logos-top { min-height: 28px; margin-bottom: 18px; }
    .logos-bottom {
      position: absolute;
      left: 28px;
      right: 28px;
      bottom: 26px;
      justify-content: center;
    }
    .logo-item img { display:block; object-fit:contain; }
    .logo-top img { max-height: 24px; max-width: 170px; }
    .logo-bottom img { max-height: 28px; max-width: 190px; }
    .content {
      display:grid;
      grid-template-columns: 360px 1px 1fr;
      gap: 18px;
      min-height: 500px;
      margin-top: 18px;
      padding-bottom: 76px;
    }
    .divider { background:#D5D9DE; }
    .left-col { padding-top:8px; padding-right:8px; }
    .right-col { padding-top:6px; }
    .title-main { color:#BE1622; font-size:32px; line-height:.98; font-weight:700; margin:0; }
    .title-sub { margin:4px 0 0; color:#BE1622; font-size:14px; font-weight:400; text-transform:uppercase; }
    .person { margin-top:18px; font-size:16px; font-weight:700; line-height:1.22; }
    .organization { margin-top:8px; font-size:11.5px; line-height:1.3; max-width:280px; }
    .event-block { margin-top:46px; max-width:270px; }
    .event-name { color:#BE1622; font-size:15px; font-weight:700; line-height:1.15; margin:0; }
    .competency-label { margin:10px 0 0; font-size:13px; font-weight:500; color:#010101; }
    .competency-pill { margin-top:8px; background:#BE1622; border-radius:4px; padding:8px 12px; min-height:38px; color:#fff; font-size:16px; font-weight:600; line-height:1.15; }
    .date { margin-top:12px; font-size:11px; color:#010101; }
    .signature { margin-top:44px; max-width:280px; }
    .signature-name { font-size:12px; font-weight:700; line-height:1.15; color:#010101; }
    .signature-role { margin-top:3px; font-size:9.5px; font-weight:500; line-height:1.2; color:#010101; }
    .signature-line { margin-top:26px; width:110px; border-top:1px solid #8C8C8C; }
    .right-head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:10px; }
    .results-title { max-width:150px; font-size:22px; font-weight:700; line-height:1.1; white-space:pre-line; margin:0; }
    .total-wrap { text-align:right; min-width:92px; }
    .total-value { color:#BE1622; font-size:38px; font-weight:700; line-height:.95; margin:0; }
    .total-label { margin-top:4px; color:#1E1E1E; font-size:10.5px; font-weight:700; }
    .section-title { margin:8px 0 6px; font-family:"Roboto", Arial, sans-serif; font-size:9px; font-weight:700; line-height:1.25; color:#1E1E1E; }
    .rows { display:grid; gap:4px; }
    .row { display:grid; grid-template-columns:18px 186px 1fr 56px; align-items:end; gap:4px; min-height:16px; font-family:"Roboto", Arial, sans-serif; }
    .row-prefix,.row-label,.row-score { font-size:8.6px; line-height:1.12; color:#1E1E1E; }
    .row-label { overflow-wrap:anywhere; }
    .row-dots { border-bottom:1px dotted #9DA5AC; margin-bottom:3px; min-width:24px; }
    .row-score { text-align:right; }
    .row-score strong { font-weight:700; }
  </style>
</head>
<body>
  <section class="passport">
    <div class="industry-brand">
      <span>Industry<br/>Skills</span>
      <img src="${industryLogoSrc}" alt="Industry Skills" />
    </div>
    <div class="bg-wave wave-left">${createWaveSvg(false)}</div>
    <div class="bg-wave wave-right">${createWaveSvg(true)}</div>

    <div class="logos-top">${renderLogoStrip(logos.top, "top")}</div>

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

    <div class="logos-bottom">${renderLogoStrip(logos.bottom, "bottom")}</div>
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
  const tmpDir = await mkdtemp(path.join(os.tmpdir(), "skill-passport-"))
  const htmlPath = path.join(tmpDir, "passport.html")
  const pdfPath = path.join(tmpDir, "passport.pdf")

  try {
    await writeFile(htmlPath, buildPassportHtml(data), "utf8")

    const chromePath = findChromeExecutable()
    await execFileAsync(
      chromePath,
      [
        "--headless=new",
        "--disable-gpu",
        "--no-first-run",
        "--no-default-browser-check",
        "--no-pdf-header-footer",
        "--no-sandbox",
        `--print-to-pdf=${pdfPath}`,
        pathToFileURL(htmlPath).href,
      ],
      { timeout: 15000, windowsHide: true, maxBuffer: 10 * 1024 * 1024 }
    )

    const pdf = await readFile(pdfPath)
    return new Uint8Array(pdf)
  } finally {
    await rm(tmpDir, { recursive: true, force: true })
  }
}
