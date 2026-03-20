"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, XCircle } from "lucide-react"
import { WaveDots } from "@/components/ui/wave-dots"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName } from "@/lib/brand"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { locale } = useI18n()
  const platformName = getPlatformName(locale)
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

          {success ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                {locale === "ru" ? "Пароль изменён!" : "Password Changed!"}
              </h2>
              <p className="text-sm text-gray-500">
                {locale === "ru" ? "Перенаправляем вас на страницу входа..." : "Redirecting you to login..."}
              </p>
            </div>
          ) : !token ? (
            <div className="py-4 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                {locale === "ru" ? "Недействительная ссылка" : "Invalid Link"}
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                {locale === "ru"
                  ? "Ссылка для сброса пароля недействительна или истекла"
                  : "The password reset link is invalid or has expired"}
              </p>
              <Link href="/forgot-password">
                <Button className="w-full">
                  {locale === "ru" ? "Запросить новую ссылку" : "Request New Link"}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                {locale === "ru" ? "Новый пароль" : "New Password"}
              </h2>
              <p className="mb-6 text-sm text-gray-500">
                {locale === "ru" ? "Введите новый пароль для вашего аккаунта" : "Enter a new password for your account"}
              </p>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
