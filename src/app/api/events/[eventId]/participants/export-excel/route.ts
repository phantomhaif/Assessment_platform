import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import ExcelJS from "exceljs"

export async function GET(
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

    // Get event info
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    })

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Get all custom profile fields
    const profileFields = await prisma.profileField.findMany({
      orderBy: { order: "asc" },
    })

    // Get approved applications with full user data
    const applications = await prisma.application.findMany({
      where: {
        eventId,
        status: "APPROVED",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            middleName: true,
            email: true,
            phone: true,
            organization: true,
            position: true,
            photo: true,
            customFieldValues: {
              select: {
                fieldId: true,
                value: true,
              }
            }
          },
        },
      },
      orderBy: [
        { user: { lastName: "asc" } },
        { user: { firstName: "asc" } },
      ],
    })

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Industry Skills Platform"
    workbook.created = new Date()

    const worksheet = workbook.addWorksheet("Участники")

    // Define columns
    const columns: Partial<ExcelJS.Column>[] = [
      { header: "№", key: "num", width: 5 },
      { header: "Фото", key: "photo", width: 15 },
      { header: "URL фото", key: "photoUrl", width: 40 },
      { header: "Фамилия", key: "lastName", width: 20 },
      { header: "Имя", key: "firstName", width: 20 },
      { header: "Отчество", key: "middleName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Телефон", key: "phone", width: 20 },
      { header: "Организация", key: "organization", width: 35 },
      { header: "Должность", key: "position", width: 25 },
    ]

    // Add custom field columns
    for (const field of profileFields) {
      columns.push({
        header: field.name,
        key: `custom_${field.id}`,
        width: 25,
      })
    }

    worksheet.columns = columns

    // Style header row
    const headerRow = worksheet.getRow(1)
    headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } }
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFC41E3A" },
    }
    headerRow.alignment = { vertical: "middle", horizontal: "center" }
    headerRow.height = 25

    // Add data rows
    let rowNum = 2
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i]
      const user = app.user

      // Create custom fields map
      const customFieldsMap: Record<string, string> = {}
      user.customFieldValues.forEach(v => {
        customFieldsMap[v.fieldId] = v.value
      })

      // Prepare photo URL
      const photoUrl = user.photo
        ? user.photo.startsWith("http")
          ? user.photo
          : `${process.env.NEXTAUTH_URL || ""}${user.photo}`
        : ""

      const rowData: Record<string, string | number> = {
        num: i + 1,
        photo: "", // We'll add image separately
        photoUrl: photoUrl,
        lastName: user.lastName,
        firstName: user.firstName,
        middleName: user.middleName || "",
        email: user.email,
        phone: user.phone || "",
        organization: user.organization || "",
        position: user.position || "",
      }

      // Add custom field values
      for (const field of profileFields) {
        rowData[`custom_${field.id}`] = customFieldsMap[field.id] || ""
      }

      const row = worksheet.addRow(rowData)
      row.height = 60 // Height for photo
      row.alignment = { vertical: "middle", wrapText: true }

      // Add photo if exists
      if (photoUrl) {
        try {
          // Fetch image
          const imageResponse = await fetch(photoUrl)
          if (imageResponse.ok) {
            const imageBuffer = await imageResponse.arrayBuffer()
            const extension = photoUrl.toLowerCase().includes(".png") ? "png" : "jpeg"

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const imageId = workbook.addImage({
              buffer: new Uint8Array(imageBuffer) as any,
              extension,
            })

            // Add image to cell (column B = 1, row = rowNum)
            worksheet.addImage(imageId, {
              tl: { col: 1, row: rowNum - 1 },
              ext: { width: 50, height: 50 },
            })
          }

          // Add hyperlink to photo URL column (column C = 2)
          const photoUrlCell = worksheet.getCell(rowNum, 3)
          photoUrlCell.value = {
            text: "Скачать фото",
            hyperlink: photoUrl,
          }
          photoUrlCell.font = { color: { argb: "FF0000FF" }, underline: true }
        } catch (error) {
          console.error(`Error adding image for user ${user.id}:`, error)
          // Continue without image
        }
      }

      rowNum++
    }

    // Auto-fit columns (except photo column)
    worksheet.columns.forEach((column, index) => {
      if (index !== 1) { // Skip photo column
        let maxLength = 0
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10
          if (columnLength > maxLength) {
            maxLength = columnLength
          }
        })
        column.width = Math.min(Math.max(maxLength + 2, 10), 50)
      }
    })

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer()

    const fileName = `participants-${event.name}.xlsx`.replace(/[^\w\-а-яА-ЯёЁ .]/gi, "_")

    // Convert to Uint8Array for NextResponse compatibility
    const uint8Array = new Uint8Array(excelBuffer)

    return new NextResponse(uint8Array, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    })
  } catch (error) {
    console.error("Error exporting participants to Excel:", error)
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    const errorStack = error instanceof Error ? error.stack : ""
    console.error("Stack:", errorStack)
    return NextResponse.json({ error: "Internal error", details: errorMessage }, { status: 500 })
  }
}
