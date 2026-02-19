"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle } from "lucide-react"
import { WaveDots } from "@/components/ui/wave-dots"
import { useI18n } from "@/lib/i18n/context"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useI18n()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) {
      setError(locale === "ru" ? "Недействительная ссылка" : "Invalid link")
    }
  }, [token, locale])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(locale === "ru" ? "Пароли не совпадают" : "Passwords do not match")
      return
    }

    if (password.length < 6) {
      setError(locale === "ru" ? "Пароль минимум 6 символов" : "Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.push("/login"), 3000)
      } else {
        setError(data.error || (locale === "ru" ? "Ошибка сброса пароля" : "Password reset error"))
      }
    } catch {
      setError(locale === "ru" ? "Ошибка соединения" : "Connection error")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-white">
      <WaveDots className="absolute inset-0 w-full h-full pointer-events-none" />

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

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {locale === "ru" ? "Пароль изменён!" : "Password Changed!"}
              </h2>
              <p className="text-gray-500 text-sm">
                {locale === "ru"
                  ? "Перенаправляем вас на страницу входа..."
                  : "Redirecting you to login..."
                }
              </p>
            </div>
          ) : !token ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {locale === "ru" ? "Недействительная ссылка" : "Invalid Link"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {locale === "ru"
                  ? "Ссылка для сброса пароля недействительна или истекла"
                  : "The password reset link is invalid or has expired"
                }
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">
                  {locale === "ru" ? "Запросить новую ссылку" : "Request New Link"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {locale === "ru" ? "Новый пароль" : "New Password"}
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                {locale === "ru"
                  ? "Введите новый пароль для вашего аккаунта"
                  : "Enter a new password for your account"
                }
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={locale === "ru" ? "Новый пароль" : "New Password"}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={locale === "ru" ? "Минимум 6 символов" : "Min 6 characters"}
                  required
                  minLength={6}
                />
                <Input
                  label={locale === "ru" ? "Повторите пароль" : "Confirm Password"}
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={locale === "ru" ? "Повторите пароль" : "Repeat password"}
                  required
                />
                <Button type="submit" className="w-full" isLoading={isLoading}>
                  {locale === "ru" ? "Сохранить пароль" : "Save Password"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
