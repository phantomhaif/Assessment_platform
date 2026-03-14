import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateCode, storeCode } from "@/lib/verification-codes"
import { isEmailConfigured, sendVerificationCode } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      // Return same error to prevent email enumeration
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "invalid_credentials" }, { status: 401 })
    }

    // Check if email service is configured
    if (!isEmailConfigured()) {
      return NextResponse.json({ error: "email_not_configured" }, { status: 503 })
    }

    const code = generateCode()
    storeCode(email.toLowerCase(), code)

    await sendVerificationCode(email, code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error sending verification code:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
