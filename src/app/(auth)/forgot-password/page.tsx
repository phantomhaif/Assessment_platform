"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail } from "lucide-react"
import { WaveDots } from "@/components/ui/wave-dots"
import { useI18n } from "@/lib/i18n/context"

export default function ForgotPasswordPage() {
  const { locale } = useI18n()
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
      {/* Wave dots — corners only */}
      <WaveDots className="absolute top-0 right-0 w-2/5 h-2/5 pointer-events-none opacity-50" />
      <WaveDots className="absolute bottom-0 left-0 w-2/5 h-2/5 pointer-events-none opacity-50" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#C41E3A] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base">IS</span>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">Industry Skills</p>
              <p className="text-gray-400 text-xs">
                {locale === "ru" ? "Платформа оценивания" : "Assessment Platform"}
              </p>
            </div>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {locale === "ru" ? "Письмо отправлено" : "Email Sent"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {locale === "ru"
                  ? `Если аккаунт с адресом ${email} существует, мы отправили ссылку для сброса пароля. Проверьте почту.`
                  : `If an account with ${email} exists, we sent a password reset link. Check your email.`
                }
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === "ru" ? "Вернуться ко входу" : "Back to Login"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === "ru" ? "Забыли пароль?" : "Forgot Password?"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {locale === "ru"
                  ? "Введите ваш email и мы отправим ссылку для сброса пароля"
                  : "Enter your email and we'll send a password reset link"
                }
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
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
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-[#C41E3A] flex items-center justify-center gap-1"
                >
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
