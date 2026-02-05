import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

interface ParsedCriterion {
  code: string
  subCriterionCode: string
  subCriterionName: string
  type: "M" | "J"
  description: string
  verificationMethod: string
  skillGroupNumber: number
  maxScore: number
  judgementOptions?: { score: number; label: string }[]
}

interface ParsedModule {
  code: string
  name: string
  criteria: ParsedCriterion[]
}

function parseAssessmentSchema(workbook: XLSX.WorkBook) {
  const sheetName = workbook.SheetNames.find(name =>
    name.toLowerCase().includes("assessment") || name.toLowerCase().includes("aspect")
  ) || workbook.SheetNames[0]

  const sheet = workbook.Sheets[sheetName]
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][]

  const modules: ParsedModule[] = []
  const skillGroups: { number: number; name: string; nameEn: string }[] = []

  // Parse skill groups from "Sections of the standard" sheet if exists
  const sectionsSheet = workbook.Sheets["Sections of the standard"]
  if (sectionsSheet) {
    const sectionsData = XLSX.utils.sheet_to_json(sectionsSheet, { header: 1 }) as any[][]
    for (let i = 1; i < sectionsData.length; i++) {
      const row = sectionsData[i]
      if (row[0] && row[1]) {
        skillGroups.push({
          number: parseInt(row[0]) || i,
          name: row[1]?.toString() || "",
          nameEn: row[2]?.toString() || "",
        })
      }
    }
  }

  // Default skill groups if not found in file
  if (skillGroups.length === 0) {
    const defaultGroups = [
      { number: 1, name: "Организация рабочего процесса", nameEn: "Workflow organization" },
      { number: 2, name: "Командное взаимодействие и коммуникация", nameEn: "Team interaction and communication" },
      { number: 3, name: "Менеджмент", nameEn: "Management" },
      { number: 4, name: "Аналитика данных", nameEn: "Data Analytics" },
      { number: 5, name: "Экономико-математическое моделирование", nameEn: "Economic and mathematical modeling" },
      { number: 6, name: "Оптимизация, автоматизация и роботизация", nameEn: "Optimization, automation and robotization" },
      { number: 7, name: "Основы механики, электроники и робототехники", nameEn: "Fundamentals of mechanics, electronics and robotics" },
      { number: 8, name: "Моделирование и симуляция производственных процессов", nameEn: "Modeling and simulation of production processes" },
      { number: 9, name: "Высокотехнологические навыки", nameEn: "Hi-tech skills" },
    ]
    skillGroups.push(...defaultGroups)
  }

  // Parse assessment criteria
  let currentModule: ParsedModule | null = null
  let currentSubCriterion = { code: "", name: "" }

  for (let i = 5; i < data.length; i++) {
    const row = data[i]
    if (!row || row.length === 0) continue

    const code = row[0]?.toString()?.trim()
    const subCriteria = row[1]?.toString()?.trim()
    const type = row[2]?.toString()?.trim()?.toUpperCase()
    const aspect = row[3]?.toString()?.trim()
    const judgesScore = row[4]
    const verificationMethod = row[5]?.toString()?.trim() || ""
    const skillGroupNum = parseInt(row[7]?.toString()) || 0
    const maxScore = parseFloat(row[8]?.toString()) || 0

    // New module (A, B, C, D)
    if (code && code.match(/^[A-Z]$/) && subCriteria) {
      if (currentModule) {
        modules.push(currentModule)
      }
      currentModule = {
        code,
        name: subCriteria,
        criteria: [],
      }
      continue
    }

    // New sub-criterion (numbered: 1, 2, 3...)
    if (code && code.match(/^\d+$/) && subCriteria && !type) {
      currentSubCriterion = { code, name: subCriteria }
      continue
    }

    // Criterion (M or J type)
    if (type === "M" || type === "J") {
      if (!currentModule) continue

      const criterion: ParsedCriterion = {
        code: `${currentModule.code}${currentSubCriterion.code}`,
        subCriterionCode: currentSubCriterion.code,
        subCriterionName: currentSubCriterion.name,
        type: type as "M" | "J",
        description: aspect || subCriteria || "",
        verificationMethod,
        skillGroupNumber: skillGroupNum,
        maxScore,
      }

      // Parse judgement options for J-type
      if (type === "J") {
        criterion.judgementOptions = []
        // Look ahead for judgement options (rows with score values)
        for (let j = i + 1; j < Math.min(i + 5, data.length); j++) {
          const optRow = data[j]
          if (optRow && optRow[4] !== undefined && optRow[5]) {
            const score = parseFloat(optRow[4]?.toString())
            const label = optRow[5]?.toString()
            if (!isNaN(score) && label) {
              criterion.judgementOptions.push({ score, label })
            }
          } else {
            break
          }
        }
      }

      currentModule.criteria.push(criterion)
    }
  }

  if (currentModule) {
    modules.push(currentModule)
  }

  return { modules, skillGroups }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "ORGANIZER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { eventId } = await params
    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Файл не загружен" }, { status: 400 })
    }

    // Read Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })

    // Parse schema
    const { modules, skillGroups } = parseAssessmentSchema(workbook)

    if (modules.length === 0) {
      return NextResponse.json({ error: "Не удалось распарсить схему оценки" }, { status: 400 })
    }

    // Delete existing schema if exists
    await prisma.assessmentSchema.deleteMany({
      where: { eventId },
    })

    // Create new schema
    const schema = await prisma.assessmentSchema.create({
      data: {
        eventId,
        name: file.name,
        totalMaxScore: modules.reduce((sum, m) =>
          sum + m.criteria.reduce((s, c) => s + c.maxScore, 0), 0
        ),
      },
    })

    // Create skill groups
    for (const group of skillGroups) {
      await prisma.skillGroup.create({
        data: {
          schemaId: schema.id,
          number: group.number,
          name: group.name,
          nameEn: group.nameEn,
          maxScore: 0, // Will be calculated
        },
      })
    }

    // Create modules and criteria
    for (let moduleOrder = 0; moduleOrder < modules.length; moduleOrder++) {
      const module = modules[moduleOrder]

      const createdModule = await prisma.assessmentModule.create({
        data: {
          schemaId: schema.id,
          code: module.code,
          name: module.name,
          maxScore: module.criteria.reduce((sum, c) => sum + c.maxScore, 0),
          order: moduleOrder,
        },
      })

      // Group criteria by sub-criterion
      const subCriteriaMap = new Map<string, typeof module.criteria>()
      for (const criterion of module.criteria) {
        const key = `${criterion.subCriterionCode}-${criterion.subCriterionName}`
        if (!subCriteriaMap.has(key)) {
          subCriteriaMap.set(key, [])
        }
        subCriteriaMap.get(key)!.push(criterion)
      }

      let subOrder = 0
      for (const [key, criteria] of subCriteriaMap) {
        const [code, name] = key.split("-")

        const createdSubCriterion = await prisma.subCriterion.create({
          data: {
            moduleId: createdModule.id,
            code: code || String(subOrder + 1),
            name: name || "Критерий",
            order: subOrder++,
          },
        })

        for (let critOrder = 0; critOrder < criteria.length; critOrder++) {
          const criterion = criteria[critOrder]

          // Find skill group
          const skillGroup = await prisma.skillGroup.findFirst({
            where: {
              schemaId: schema.id,
              number: criterion.skillGroupNumber,
            },
          })

          await prisma.criterion.create({
            data: {
              subCriterionId: createdSubCriterion.id,
              skillGroupId: skillGroup?.id,
              type: criterion.type,
              description: criterion.description,
              verificationMethod: criterion.verificationMethod,
              maxScore: criterion.maxScore,
              judgementOptions: criterion.judgementOptions || null,
              order: critOrder,
            },
          })
        }
      }
    }

    // Update skill group max scores
    const updatedSkillGroups = await prisma.skillGroup.findMany({
      where: { schemaId: schema.id },
      include: { criteria: true },
    })

    for (const group of updatedSkillGroups) {
      await prisma.skillGroup.update({
        where: { id: group.id },
        data: {
          maxScore: group.criteria.reduce((sum, c) => sum + c.maxScore, 0),
        },
      })
    }

    return NextResponse.json({
      success: true,
      modulesCount: modules.length,
      criteriaCount: modules.reduce((sum, m) => sum + m.criteria.length, 0),
    })
  } catch (error) {
    console.error("Error uploading schema:", error)
    return NextResponse.json({ error: "Ошибка загрузки схемы" }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params

    const schema = await prisma.assessmentSchema.findUnique({
      where: { eventId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            subCriteria: {
              orderBy: { order: "asc" },
              include: {
                criteria: {
                  orderBy: { order: "asc" },
                  include: { skillGroup: true },
                },
              },
            },
          },
        },
        skillGroups: {
          orderBy: { number: "asc" },
        },
      },
    })

    if (!schema) {
      return NextResponse.json({ error: "Schema not found" }, { status: 404 })
    }

    return NextResponse.json(schema)
  } catch (error) {
    console.error("Error fetching schema:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
