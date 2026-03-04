import fs from "node:fs/promises"
import path from "node:path"
import fontkit from "@pdf-lib/fontkit"
import { PDFDocument, PDFFont, PDFImage, rgb } from "pdf-lib"

export interface SkillPassportData {
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
  partnerLogos?: Array<{
    url: string
    name?: string
  }>
}

const TEMPLATE_PATH = path.join(process.cwd(), "public/templates/passport-template.pdf")
const UPLOADS_BASE = process.env.NODE_ENV === "production"
  ? "/app/uploads"
  : path.join(process.cwd(), "public", "uploads")
const FONT_PATHS = {
  montserratMedium: path.join(process.cwd(), "public/fonts/Montserrat-Medium.ttf"),
  montserratSemiBold: path.join(process.cwd(), "public/fonts/Montserrat-SemiBold.ttf"),
  montserratBold: path.join(process.cwd(), "public/fonts/Montserrat-Bold.ttf"),
  robotoRegular: path.join(process.cwd(), "public/fonts/Roboto-Regular.ttf"),
}

const colors = {
  red: rgb(189 / 255, 22 / 255, 33 / 255),
  black: rgb(0, 0, 0),
  nearBlack: rgb(30 / 255, 30 / 255, 30 / 255),
  gray: rgb(126 / 255, 135 / 255, 143 / 255),
  turquoise: rgb(68 / 255, 182 / 255, 177 / 255),
}

const DOT_LEADER = ".".repeat(80)

const templateBytesPromise = fs.readFile(TEMPLATE_PATH)
const fontBytesPromises = {
  montserratMedium: fs.readFile(FONT_PATHS.montserratMedium),
  montserratSemiBold: fs.readFile(FONT_PATHS.montserratSemiBold),
  montserratBold: fs.readFile(FONT_PATHS.montserratBold),
  robotoRegular: fs.readFile(FONT_PATHS.robotoRegular),
}

function clampText(value: string, maxLength: number): string {
  const text = value?.trim() || ""
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`
}

function formatScore(score: number): string {
  if (!Number.isFinite(score)) return "0"
  const rounded = Math.round(score * 100) / 100
  if (Number.isInteger(rounded)) return rounded.toString()
  return rounded.toFixed(2).replace(".", ",")
}

function topToY(pageHeight: number, top: number, fontSize: number): number {
  return pageHeight - top - fontSize
}

function fitTextWithEllipsis(text: string, font: PDFFont, size: number, maxWidth: number): string {
  const normalized = (text || "").replace(/\s+/g, " ").trim()
  if (!normalized) return ""
  if (font.widthOfTextAtSize(normalized, size) <= maxWidth) return normalized

  const ellipsis = "..."
  let trimmed = normalized
  while (trimmed.length > 0) {
    const candidate = `${trimmed}${ellipsis}`
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) return candidate
    trimmed = trimmed.slice(0, -1).trimEnd()
  }

  return ellipsis
}

function wrapText(
  text: string,
  font: PDFFont,
  size: number,
  maxWidth: number,
  maxLines: number
): string[] {
  const normalized = (text || "").replace(/\s+/g, " ").trim()
  if (!normalized) return []

  const words = normalized.split(" ")
  const lines: string[] = []
  let current = ""
  let index = 0

  while (index < words.length) {
    const next = words[index]
    const candidate = current ? `${current} ${next}` : next

    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
      index += 1
      continue
    }

    if (!current) {
      lines.push(fitTextWithEllipsis(next, font, size, maxWidth))
      index += 1
    } else {
      lines.push(current)
      current = ""
    }

    if (lines.length === maxLines) {
      return lines
    }
  }

  if (current) {
    lines.push(current)
  }

  if (lines.length <= maxLines) {
    return lines
  }

  const head = lines.slice(0, maxLines - 1)
  const tail = lines.slice(maxLines - 1).join(" ")
  head.push(fitTextWithEllipsis(tail, font, size, maxWidth))
  return head
}

function drawWrappedText(params: {
  page: any
  pageHeight: number
  text: string
  x: number
  top: number
  width: number
  font: PDFFont
  size: number
  color: ReturnType<typeof rgb>
  lineHeight: number
  maxLines: number
}) {
  const {
    page,
    pageHeight,
    text,
    x,
    top,
    width,
    font,
    size,
    color,
    lineHeight,
    maxLines,
  } = params

  const lines = wrapText(text, font, size, width, maxLines)
  lines.forEach((line, index) => {
    page.drawText(line, {
      x,
      y: topToY(pageHeight, top + index * lineHeight, size),
      font,
      size,
      color,
    })
  })
}

function drawRightAlignedText(params: {
  page: any
  pageHeight: number
  text: string
  rightX: number
  top: number
  font: PDFFont
  size: number
  color: ReturnType<typeof rgb>
}) {
  const { page, pageHeight, text, rightX, top, font, size, color } = params
  const normalized = (text || "").trim()
  const width = font.widthOfTextAtSize(normalized, size)
  page.drawText(normalized, {
    x: rightX - width,
    y: topToY(pageHeight, top, size),
    font,
    size,
    color,
  })
}

function drawRectFromTop(params: {
  page: any
  pageHeight: number
  x: number
  top: number
  width: number
  height: number
  color: ReturnType<typeof rgb>
}) {
  const { page, pageHeight, x, top, width, height, color } = params
  page.drawRectangle({
    x,
    y: pageHeight - top - height,
    width,
    height,
    color,
    opacity: 1,
    borderOpacity: 1,
  })
}

function drawPillFromTop(params: {
  page: any
  pageHeight: number
  x: number
  top: number
  width: number
  height: number
  color: ReturnType<typeof rgb>
}) {
  const { page, pageHeight, x, top, width, height, color } = params
  const y = pageHeight - top - height
  const radius = height / 2
  const centerY = y + radius

  page.drawRectangle({
    x: x + radius,
    y,
    width: Math.max(0, width - radius * 2),
    height,
    color,
    opacity: 1,
    borderOpacity: 1,
  })

  page.drawCircle({
    x: x + radius,
    y: centerY,
    size: radius,
    color,
    opacity: 1,
    borderOpacity: 1,
  })

  page.drawCircle({
    x: x + width - radius,
    y: centerY,
    size: radius,
    color,
    opacity: 1,
    borderOpacity: 1,
  })
}

async function readPartnerLogoBytes(url: string): Promise<Uint8Array | null> {
  const safeUrl = (url || "").trim()
  if (!safeUrl) return null

  if (safeUrl.startsWith("/api/files/")) {
    const relativePath = safeUrl
      .replace(/^\/api\/files\//, "")
      .split("/")
      .map((segment) => segment.replace(/\.\./g, "").replace(/[<>:"|?*]/g, ""))
      .filter(Boolean)
      .join(path.sep)

    if (!relativePath) return null

    try {
      return await fs.readFile(path.join(UPLOADS_BASE, relativePath))
    } catch {
      return null
    }
  }

  if (safeUrl.startsWith("http://") || safeUrl.startsWith("https://")) {
    try {
      const response = await fetch(safeUrl)
      if (!response.ok) return null
      return new Uint8Array(await response.arrayBuffer())
    } catch {
      return null
    }
  }

  return null
}

async function embedPartnerLogo(pdfDoc: PDFDocument, bytes: Uint8Array, url: string): Promise<PDFImage | null> {
  const normalized = url.toLowerCase()

  if (normalized.endsWith(".png")) {
    try {
      return await pdfDoc.embedPng(bytes)
    } catch {}
  }
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) {
    try {
      return await pdfDoc.embedJpg(bytes)
    } catch {}
  }

  try {
    return await pdfDoc.embedPng(bytes)
  } catch {
    try {
      return await pdfDoc.embedJpg(bytes)
    } catch {
      return null
    }
  }
}

async function drawPartnerLogos(params: {
  page: any
  pageHeight: number
  pdfDoc: PDFDocument
  logos: Array<{ url: string; name?: string }>
  maskColor: ReturnType<typeof rgb>
}) {
  const { page, pageHeight, pdfDoc, logos, maskColor } = params
  const rawLogos = (logos || []).filter((logo) => logo?.url).slice(0, 10)
  if (rawLogos.length === 0) return

  const prepared = await Promise.all(
    rawLogos.map(async (logo) => {
      const bytes = await readPartnerLogoBytes(logo.url)
      if (!bytes) return null
      const image = await embedPartnerLogo(pdfDoc, bytes, logo.url)
      if (!image) return null
      return image
    })
  )

  const images = prepared.filter((image): image is PDFImage => image !== null)
  if (images.length === 0) return

  // Replace default sponsor strip with logos linked to this event.
  const area = { x: 24, top: 14, width: 522, height: 62, gap: 8 }
  drawRectFromTop({
    page,
    pageHeight,
    x: area.x,
    top: area.top,
    width: area.width,
    height: area.height,
    color: maskColor,
  })

  const slots = images.length
  const slotWidth = (area.width - area.gap * Math.max(0, slots - 1)) / slots
  const maxLogoHeight = area.height - 4

  images.forEach((image, index) => {
    const scale = Math.min(slotWidth / image.width, maxLogoHeight / image.height)
    const width = image.width * scale
    const height = image.height * scale
    const x = area.x + index * (slotWidth + area.gap) + (slotWidth - width) / 2
    const y = pageHeight - area.top - area.height + (area.height - height) / 2

    page.drawImage(image, { x, y, width, height })
  })
}

function drawScoreRow(params: {
  page: any
  pageHeight: number
  top: number
  height: number
  prefix: string
  label: string
  score: number
  maxScore: number
  robotoRegular: PDFFont
}) {
  const {
    page,
    pageHeight,
    top,
    height,
    prefix,
    label,
    score,
    maxScore,
    robotoRegular,
  } = params

  const rowFontSize = 10
  const dotsFontSize = 8
  const rowTextTop = top + Math.max(0, (height - rowFontSize) / 2)

  const prefixX = 433
  const labelX = 448
  const labelWidth = 220
  const dotsX = 670
  const dotsWidth = 68
  const scoreRightX = 805

  const safeLabel = fitTextWithEllipsis(
    clampText(label || "", 84),
    robotoRegular,
    10,
    labelWidth
  )
  const scoreValue = formatScore(score)
  const scoreMax = `/${formatScore(maxScore)}`

  page.drawText(prefix, {
    x: prefixX,
    y: topToY(pageHeight, rowTextTop, 10),
    font: robotoRegular,
    size: 10,
    color: colors.nearBlack,
  })

  const maxLabelLines = height > 18 ? 2 : 1
  const labelLines = wrapText(safeLabel, robotoRegular, 10, labelWidth, maxLabelLines)
  labelLines.forEach((line, index) => {
    page.drawText(line, {
      x: labelX,
      y: topToY(pageHeight, rowTextTop + index * 12, 10),
      font: robotoRegular,
      size: 10,
      color: colors.nearBlack,
    })
  })

  const scoreText = `${scoreValue}${scoreMax}`
  const scoreWidth = robotoRegular.widthOfTextAtSize(scoreText, 10)
  const dotWidth = Math.max(0.1, robotoRegular.widthOfTextAtSize(".", dotsFontSize))
  const dotCount = Math.max(0, Math.floor(dotsWidth / dotWidth))
  const dots = DOT_LEADER.slice(0, Math.min(dotCount, DOT_LEADER.length))

  if (dots) {
    page.drawText(dots, {
      x: dotsX,
      y: topToY(pageHeight, rowTextTop, dotsFontSize),
      font: robotoRegular,
      size: dotsFontSize,
      color: colors.turquoise,
    })
  }

  page.drawText(scoreText, {
    x: scoreRightX - scoreWidth,
    y: topToY(pageHeight, rowTextTop, 10),
    font: robotoRegular,
    size: 10,
    color: colors.nearBlack,
  })
}

export async function renderSkillPassportPdf(data: SkillPassportData): Promise<Uint8Array> {
  const [templateBytes, montserratMediumBytes, montserratSemiBoldBytes, montserratBoldBytes, robotoRegularBytes] =
    await Promise.all([
      templateBytesPromise,
      fontBytesPromises.montserratMedium,
      fontBytesPromises.montserratSemiBold,
      fontBytesPromises.montserratBold,
      fontBytesPromises.robotoRegular,
    ])

  const templateDoc = await PDFDocument.load(templateBytes)
  const pdfDoc = await PDFDocument.create()
  const [firstPage] = await pdfDoc.copyPages(templateDoc, [0])
  pdfDoc.addPage(firstPage)
  pdfDoc.registerFontkit(fontkit)

  const montserratMedium = await pdfDoc.embedFont(montserratMediumBytes, { subset: true })
  const montserratSemiBold = await pdfDoc.embedFont(montserratSemiBoldBytes, { subset: true })
  const montserratBold = await pdfDoc.embedFont(montserratBoldBytes, { subset: true })
  const robotoRegular = await pdfDoc.embedFont(robotoRegularBytes, { subset: true })

  const page = pdfDoc.getPage(0)
  const { height: pageHeight } = page.getSize()
  const maskWhite = rgb(1, 1, 1)
  const maskGray = maskWhite

  const participantFullName = clampText(
    [data.participantName, data.participantMiddleName].filter(Boolean).join(" ").trim(),
    62
  )

  // Clean sample values from template (only dynamic fields).
  drawRectFromTop({ page, pageHeight, x: 57, top: 168, width: 330, height: 105, color: maskGray })
  drawRectFromTop({ page, pageHeight, x: 57, top: 328, width: 260, height: 46, color: maskGray })
  drawRectFromTop({ page, pageHeight, x: 57, top: 390, width: 290, height: 30, color: maskWhite })
  drawPillFromTop({ page, pageHeight, x: 60, top: 392, width: 280, height: 26, color: colors.red })
  drawRectFromTop({ page, pageHeight, x: 57, top: 443, width: 170, height: 20, color: maskGray })
  drawRectFromTop({ page, pageHeight, x: 703, top: 85, width: 102, height: 44, color: maskWhite })
  await drawPartnerLogos({
    page,
    pageHeight,
    pdfDoc,
    logos: data.partnerLogos || [],
    maskColor: maskWhite,
  })

  drawWrappedText({
    page,
    pageHeight,
    text: participantFullName || "-",
    x: 57,
    top: 168,
    width: 330,
    font: montserratMedium,
    size: 24,
    color: colors.black,
    lineHeight: 29,
    maxLines: 2,
  })

  drawWrappedText({
    page,
    pageHeight,
    text: clampText(data.organization || "-", 150),
    x: 57,
    top: 233,
    width: 330,
    font: montserratBold,
    size: 16,
    color: colors.black,
    lineHeight: 19,
    maxLines: 2,
  })

  drawWrappedText({
    page,
    pageHeight,
    text: clampText(data.eventName || "-", 90),
    x: 57,
    top: 328,
    width: 260,
    font: montserratMedium,
    size: 16,
    color: colors.red,
    lineHeight: 19,
    maxLines: 2,
  })

  drawWrappedText({
    page,
    pageHeight,
    text: clampText(data.competency || "-", 46),
    x: 72,
    top: 393,
    width: 270,
    font: montserratSemiBold,
    size: 16,
    color: rgb(1, 1, 1),
    lineHeight: 20,
    maxLines: 1,
  })

  drawWrappedText({
    page,
    pageHeight,
    text: data.dateRange || "-",
    x: 57,
    top: 443,
    width: 280,
    font: montserratMedium,
    size: 16,
    color: colors.black,
    lineHeight: 19,
    maxLines: 1,
  })

  drawRightAlignedText({
    page,
    pageHeight,
    text: formatScore(data.totalScore),
    rightX: 805,
    top: 85,
    font: montserratBold,
    size: 36,
    color: colors.red,
  })

  const sortedSkillGroups = [...(data.skillGroups || [])].sort((a, b) => a.number - b.number)
  const sortedModules = [...(data.modules || [])].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), "en", { numeric: true })
  )

  const skillRowSlots = [
    { top: 192.94, height: 12.5 },
    { top: 211.86, height: 12.5 },
    { top: 230.78, height: 12.5 },
    { top: 249.7, height: 12.5 },
    { top: 268.62, height: 12.5 },
    { top: 290.0, height: 24.0 },
    { top: 325.0, height: 12.5 },
    { top: 344.0, height: 24.0 },
    { top: 378.0, height: 12.5 },
  ]
  const moduleRowSlots = [
    { top: 433.34, height: 12.5 },
    { top: 453.32, height: 12.5 },
    { top: 472.24, height: 12.5 },
    { top: 492.21, height: 12.5 },
  ]

  skillRowSlots.forEach((slot, index) => {
    drawRectFromTop({
      page,
      pageHeight,
      x: 432,
      top: slot.top - 1,
      width: 238,
      height: slot.height + 2,
      color: maskGray,
    })
    drawRectFromTop({
      page,
      pageHeight,
      x: 748,
      top: slot.top - 1,
      width: 62,
      height: slot.height + 2,
      color: maskGray,
    })
    drawRectFromTop({
      page,
      pageHeight,
      x: 670,
      top: slot.top - 1,
      width: 70,
      height: slot.height + 2,
      color: maskGray,
    })

    const group = sortedSkillGroups[index]
    if (!group) return
    drawScoreRow({
      page,
      pageHeight,
      top: slot.top,
      height: slot.height,
      prefix: `${group.number}.`,
      label: group.name,
      score: group.score,
      maxScore: group.maxScore,
      robotoRegular,
    })
  })

  moduleRowSlots.forEach((slot, index) => {
    drawRectFromTop({
      page,
      pageHeight,
      x: 432,
      top: slot.top - 1,
      width: 238,
      height: slot.height + 2,
      color: maskGray,
    })
    drawRectFromTop({
      page,
      pageHeight,
      x: 748,
      top: slot.top - 1,
      width: 62,
      height: slot.height + 2,
      color: maskGray,
    })
    drawRectFromTop({
      page,
      pageHeight,
      x: 670,
      top: slot.top - 1,
      width: 70,
      height: slot.height + 2,
      color: maskGray,
    })

    const module = sortedModules[index]
    if (!module) return
    const moduleCode = String(module.code || index + 1).trim()
    const prefix = moduleCode.endsWith(".") ? moduleCode : `${moduleCode}.`
    drawScoreRow({
      page,
      pageHeight,
      top: slot.top,
      height: slot.height,
      prefix,
      label: module.name,
      score: module.score,
      maxScore: module.maxScore,
      robotoRegular,
    })
  })

  return pdfDoc.save()
}
