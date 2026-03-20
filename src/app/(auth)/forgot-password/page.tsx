"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail } from "lucide-react"
import { WaveDots } from "@/components/ui/wave-dots"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName } from "@/lib/brand"

export default function ForgotPasswordPage() {
  const { locale } = useI18n()
  const platformName = getPlatformName(locale)
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setSent(true)
      } else {
        const data = await response.json()
        setError(data.error || (locale === "ru" ? "Ошибка отправки" : "Send error"))
      }
    } catch {
      setError(locale === "ru" ? "Ошибка соединения" : "Connection error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white">
      <WaveDots className="pointer-events-none absolute right-0 top-0 h-2/5 w-2/5 opacity-50" />
      <WaveDots className="pointer-events-none absolute bottom-0 left-0 h-2/5 w-2/5 opacity-50" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
          <div className="mb-8 flex items-center gap-3">
            <Image src="/logo.png" alt="Industry Skills" width={40} height={40} className="flex-shrink-0" />
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-gray-900">Industry Skills</p>
              <p className="max-w-[220px] text-[10px] leading-tight text-gray-400">
                {platformName}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                {locale === "ru" ? "Письмо отправлено" : "Email Sent"}
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                {locale === "ru"
                  ? `Если аккаунт с адресом ${email} существует, мы отправили ссылку для сброса пароля. Проверьте почту.`
                  : `If an account with ${email} exists, we sent a password reset link. Check your email.`}
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  {locale === "ru" ? "Вернуться ко входу" : "Back to Login"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {locale === "ru" ? "Забыли пароль?" : "Forgot Password?"}
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                {locale === "ru"
                  ? "Введите ваш email и мы отправим ссылку для сброса пароля"
                  : "Enter your email and we'll send a password reset link"}
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  {locale === "ru" ? "Отправить ссылку" : "Send Reset Link"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-[#C41E3A]">
                  <ArrowLeft className="h-4 w-4" />
                  {locale === "ru" ? "Вернуться ко входу" : "Back to Login"}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
