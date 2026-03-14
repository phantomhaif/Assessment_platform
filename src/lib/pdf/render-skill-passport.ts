import React from "react"
import path from "node:path"
import * as ReactPdf from "@react-pdf/renderer"
import SkillPassportDocument, {
  type SkillPassportData,
} from "./passport-template"

export type { PassportLocale, SkillPassportData } from "./passport-template"

let fontsRegistered = false

function ensureFontsRegistered() {
  if (fontsRegistered) return
  const fontBase = path.join(process.cwd(), "public", "fonts")

  ReactPdf.Font.register({
    family: "Montserrat",
    fonts: [
      { src: path.join(fontBase, "Montserrat-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(fontBase, "Montserrat-Medium.ttf"), fontWeight: 500 },
      { src: path.join(fontBase, "Montserrat-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(fontBase, "Montserrat-Bold.ttf"), fontWeight: "bold" },
    ],
  })

  ReactPdf.Font.register({
    family: "Roboto",
    fonts: [
      { src: path.join(fontBase, "Roboto-Regular.ttf"), fontWeight: "normal" },
      { src: path.join(fontBase, "Roboto-Bold.ttf"), fontWeight: "bold" },
    ],
  })

  fontsRegistered = true
}

export async function renderSkillPassportPdf(data: SkillPassportData): Promise<Uint8Array> {
  if (!SkillPassportDocument) {
    throw new Error("SkillPassportDocument export not found")
  }
  ensureFontsRegistered()
  const document = React.createElement(SkillPassportDocument, {
    data,
  }) as React.ReactElement<ReactPdf.DocumentProps>
  const buffer = await ReactPdf.renderToBuffer(document)
  return new Uint8Array(buffer)
}
