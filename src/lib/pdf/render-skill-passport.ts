import { existsSync, readFileSync } from "node:fs"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
import { pathToFileURL } from "node:url"
import puppeteer from "puppeteer-core"
import { getUploadsFilePathFromApiUrl } from "@/lib/uploads"

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
  passportBackgroundUrl?: string
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

function filePathToDataUrl(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  const mimeType =
    ext === ".png" ? "image/png" :
    ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
    ext === ".svg" ? "image/svg+xml" :
    ext === ".webp" ? "image/webp" :
    "application/octet-stream"
  const base64 = readFileSync(filePath).toString("base64")
  return `data:${mimeType};base64,${base64}`
}

function resolveBackgroundSrc(locale: PassportLocale, passportBackgroundUrl?: string) {
  if (passportBackgroundUrl) {
    const filePath = getUploadsFilePathFromApiUrl(passportBackgroundUrl)
    if (filePath && existsSync(filePath)) {
      return filePathToDataUrl(filePath)
    }
  }

  return backgroundSets[locale]
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
          <span class="row-main">
            <span class="row-label">${escapeHtml((item.name || "-").replace(/\s+/g, " ").trim())}</span>
            <span class="row-dots"></span>
          </span>
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
  const backgroundSrc = resolveBackgroundSrc(locale, data.passportBackgroundUrl)
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
      padding: 28px 38px 34px;
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
    .content {
      position: relative;
      z-index: 1;
      min-height: 500px;
      padding-top: 100px;
      padding-bottom: 34px;
    }
    .divider {
      position: absolute;
      top: 100px;
      bottom: 34px;
      left: 50%;
      width: 1px;
      transform: translateX(-0.5px);
      background: #D5D9DE;
    }
    .left-col {
      position: absolute;
      top: 110px;
      left: 38px;
      width: calc(50% - 54px);
      padding-right: 4px;
    }
    .right-col {
      position: absolute;
      top: 108px;
      right: 38px;
      width: calc(50% - 54px);
      padding-left: 24px;
    }
    .title-main { color: #BE1622; font-size: 35px; line-height: .98; font-weight: 700; margin: 0; }
    .title-sub { margin: 6px 0 0; color: #BE1622; font-size: 15px; font-weight: 600; text-transform: uppercase; }
    .person { margin-top: 20px; font-size: 18px; font-weight: 700; line-height: 1.24; }
    .organization { margin-top: 10px; font-size: 14px; line-height: 1.18; max-width: 456px; }
    .event-block { margin-top: 58px; max-width: 452px; }
    .event-name { color: #BE1622; font-size: 17px; font-weight: 700; line-height: 1.18; margin: 0; }
    .competency-label { margin: 12px 0 0; font-size: 14px; font-weight: 500; color: #010101; }
    .competency-pill { margin-top: 10px; background: #BE1622; border-radius: 4px; padding: 10px 12px; min-height: 42px; color: #fff; font-size: 17px; font-weight: 600; line-height: 1.18; }
    .date { margin-top: 14px; font-size: 14px; line-height: 1.18; color: #010101; }
    .signature { margin-top: 50px; max-width: 456px; }
    .signature-name { font-size: 13px; font-weight: 700; line-height: 1.18; color: #010101; }
    .signature-role { margin-top: 4px; font-size: 14px; font-weight: 500; line-height: 1.12; color: #010101; }
    .signature-line { margin-top: 26px; width: 110px; border-top: 1px solid #8C8C8C; }
    .right-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; margin-bottom: 10px; }
    .results-title { max-width: 190px; font-size: 24px; font-weight: 700; line-height: 1.06; white-space: pre-line; margin: 0; }
    .total-wrap { text-align: right; min-width: 116px; }
    .total-value { color: #BE1622; font-size: 48px; font-weight: 700; line-height: .92; margin: 0; }
    .total-label { margin-top: 6px; color: #1E1E1E; font-size: 14px; font-weight: 700; line-height: 1.15; }
    .section-title { margin: 10px 0 6px; font-family: "Roboto", Arial, sans-serif; font-size: 13.25px; font-weight: 700; line-height: 1.12; color: #1E1E1E; }
    .rows { display: grid; gap: 4px; }
    .row {
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr) 68px;
      align-items: end;
      gap: 5px;
      min-height: 16px;
      font-family: "Roboto", Arial, sans-serif;
    }
    .row-main {
      position: relative;
      min-width: 0;
      --leader-offset: 0px;
    }
    .row-prefix, .row-label, .row-score { font-size: 13px; line-height: 1.08; color: #1E1E1E; }
    .row-label { display: block; overflow-wrap: anywhere; }
    .row-dots {
      position: absolute;
      left: var(--leader-offset);
      right: 0;
      bottom: 3px;
      border-bottom: 1px dotted #9DA5AC;
    }
    .row-main.no-dots .row-dots { display: none; }
    .row-score { text-align: right; }
    .row-score strong { font-weight: 700; }
  </style>
</head>
<body>
  <section class="passport">
    <img class="passport-background" src="${backgroundSrc}" alt="" />

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

      document.querySelectorAll<HTMLElement>(".row-main").forEach((rowMain) => {
        const label = rowMain.querySelector<HTMLElement>(".row-label")
        if (!label) return

        const range = document.createRange()
        range.selectNodeContents(label)
        const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0)
        if (!rects.length) {
          rowMain.classList.add("no-dots")
          return
        }

        const rowRect = rowMain.getBoundingClientRect()
        const lastRect = rects[rects.length - 1]
        const leaderOffset = Math.ceil(lastRect.right - rowRect.left + 4)
        const available = Math.floor(rowRect.width - leaderOffset)

        if (available < 18) {
          rowMain.classList.add("no-dots")
          return
        }

        rowMain.style.setProperty("--leader-offset", `${leaderOffset}px`)
      })
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
