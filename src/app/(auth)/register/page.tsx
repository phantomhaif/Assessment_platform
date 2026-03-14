"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { ArrowLeft, Mail } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { WaveDots } from "@/components/ui/wave-dots"

export default function RegisterPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [step, setStep] = useState<"form" | "verify">("form")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [verificationCode, setVerificationCode] = useState("")

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    middleName: "",
    organization: "",
    phone: "",
    agreedToTerms: false,
    agreedToDataProcessing: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError(locale === "ru" ? "Пароли не совпадают" : "Passwords do not match")
      return
    }

    if (formData.password.length < 6) {
      setError(locale === "ru" ? "Пароль должен быть не менее 6 символов" : "Password must be at least 6 characters")
      return
    }

    if (!formData.agreedToTerms || !formData.agreedToDataProcessing) {
      setError(locale === "ru" ? "Необходимо принять условия и дать согласие на обработку данных" : "You must accept terms and consent to data processing")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (locale === "ru" ? "Ошибка отправки кода" : "Error sending code"))
      }

      setStep("verify")
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "ru" ? "Ошибка отправки кода" : "Error sending code"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (verificationCode.length !== 6) {
      setError(locale === "ru" ? "Введите 6-значный код" : "Enter 6-digit code")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          verificationCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (locale === "ru" ? "Ошибка регистрации" : "Registration error"))
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "ru" ? "Ошибка регистрации" : "Registration error"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      setError(locale === "ru" ? "Код отправлен повторно" : "Code resent")
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === "ru" ? "Ошибка отправки кода" : "Error sending code"))
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <WaveDots className="absolute top-0 right-0 w-2/5 h-2/5 pointer-events-none opacity-50" />
        <WaveDots className="absolute bottom-0 left-0 w-2/5 h-2/5 pointer-events-none opacity-50" />
        <Card className="w-full max-w-md relative z-10">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 bg-[#C41E3A] rounded-xl flex items-center justify-center mb-4">
              <Mail className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl">
              {locale === "ru" ? "Подтверждение email" : "Email Verification"}
            </CardTitle>
            <CardDescription>
              {locale === "ru"
                ? `Мы отправили код подтверждения на ${formData.email}`
                : `We sent a verification code to ${formData.email}`
              }
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleVerifyAndRegister}>
            <CardContent className="space-y-4">
              {error && (
                <div className={`px-4 py-3 rounded-md text-sm ${
                  error.includes("отправлен") || error.includes("resent")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}>
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {locale === "ru" ? "Код подтверждения" : "Verification Code"}
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>

              <p className="text-sm text-gray-500 text-center">
                {locale === "ru" ? "Код действителен 10 минут" : "Code is valid for 10 minutes"}
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {locale === "ru" ? "Подтвердить и зарегистрироваться" : "Verify and Register"}
              </Button>
              <div className="flex w-full flex-col gap-3 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  className="flex items-center justify-center gap-1 text-sm text-gray-600 hover:text-gray-900 sm:justify-start"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {locale === "ru" ? "Назад" : "Back"}
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-sm text-[#C41E3A] hover:underline"
                  disabled={isLoading}
                >
                  {locale === "ru" ? "Отправить код повторно" : "Resend code"}
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <WaveDots className="absolute inset-0 w-full h-full pointer-events-none z-0" />
      <Card className="w-full max-w-lg relative z-10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {locale === "ru" ? "Регистрация" : "Registration"}
          </CardTitle>
          <CardDescription>
            {locale === "ru"
              ? "Создайте аккаунт для участия в соревнованиях"
              : "Create an account to participate in competitions"
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSendCode}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={locale === "ru" ? "Фамилия *" : "Last Name *"}
                name="lastName"
                placeholder={locale === "ru" ? "Иванов" : "Smith"}
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label={locale === "ru" ? "Имя *" : "First Name *"}
                name="firstName"
                placeholder={locale === "ru" ? "Иван" : "John"}
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label={locale === "ru" ? "Отчество" : "Middle Name"}
              name="middleName"
              placeholder={locale === "ru" ? "Иванович" : ""}
              value={formData.middleName}
              onChange={handleChange}
            />

            <Input
              label="Email *"
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label={locale === "ru" ? "Организация / Учебное заведение" : "Organization / School"}
              name="organization"
              placeholder={locale === "ru" ? "МИРЭА — Российский технологический университет" : "University name"}
              value={formData.organization}
              onChange={handleChange}
            />

            <Input
              label={locale === "ru" ? "Телефон" : "Phone"}
              type="tel"
              name="phone"
              placeholder="+7 (999) 123-45-67"
              value={formData.phone}
              onChange={handleChange}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={locale === "ru" ? "Пароль *" : "Password *"}
                type="password"
                name="password"
                placeholder={locale === "ru" ? "Минимум 6 символов" : "Min 6 characters"}
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <Input
                label={locale === "ru" ? "Повторите пароль *" : "Confirm Password *"}
                type="password"
                name="confirmPassword"
                placeholder={locale === "ru" ? "Повторите пароль" : "Repeat password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-3 pt-2">
              <Checkbox
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                label={
                  <span>
                    {locale === "ru" ? "Я принимаю " : "I accept "}
                    <a href="/terms" className="text-red-600 hover:underline">
                      {locale === "ru" ? "условия использования" : "terms of use"}
                    </a>
                  </span>
                }
              />
              <Checkbox
                name="agreedToDataProcessing"
                checked={formData.agreedToDataProcessing}
                onChange={handleChange}
                label={locale === "ru"
                  ? "Я даю согласие на обработку персональных данных"
                  : "I consent to personal data processing"
                }
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              {locale === "ru" ? "Получить код подтверждения" : "Get Verification Code"}
            </Button>
            <p className="text-sm text-gray-600 text-center">
              {locale === "ru" ? "Уже есть аккаунт? " : "Already have an account? "}
              <Link href="/login" className="text-red-600 hover:underline">
                {locale === "ru" ? "Войти" : "Sign in"}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
