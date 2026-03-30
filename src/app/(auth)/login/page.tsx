"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { WaveDots } from "@/components/ui/wave-dots"
import { getPlatformDescription, getPlatformName } from "@/lib/brand"

export default function LoginPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const platformName = getPlatformName(locale)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t.auth.invalidCredentials)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError(t.errors.serverError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}>
        <WaveDots color="rgba(255,255,255,0.6)" className="pointer-events-none absolute bottom-0 right-0 h-2/5 w-2/3 opacity-60" />

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-4">
              <Image src="/logo.png" alt="Industry Skills" width={64} height={64} className="flex-shrink-0" />
              <h1 className="text-3xl font-black uppercase tracking-widest text-[#C41E3A]" style={{ fontFamily: "var(--font-heading)" }}>
                INDUSTRY
                <br />
                SKILLS
              </h1>
            </div>
            <p className="mb-2 max-w-lg text-xl text-gray-300">
              {platformName}
            </p>
            <p className="text-gray-400">
              {getPlatformDescription(locale)}
            </p>
          </div>

          <div className="space-y-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#C41E3A]"></div>
              <span>{locale === "ru" ? "Управление мероприятиями" : "Event Management"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#C41E3A]"></div>
              <span>{locale === "ru" ? "Оценка участников" : "Participant Assessment"}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-[#C41E3A]"></div>
              <span>Skills Passports</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative flex w-full items-center justify-center overflow-hidden bg-white p-8 lg:w-1/2">
        <WaveDots className="pointer-events-none absolute right-0 top-0 h-2/5 w-1/2 opacity-50" />
        <div className="absolute right-4 top-4 z-10">
          <LanguageSwitcher />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Image src="/logo.png" alt="Industry Skills" width={44} height={44} className="flex-shrink-0" />
            <h1 className="text-xl font-black uppercase tracking-widest text-[#C41E3A]" style={{ fontFamily: "var(--font-heading)" }}>
              INDUSTRY SKILLS
            </h1>
          </div>

          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-lg">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-[#0f172a]" style={{ fontFamily: "var(--font-heading)" }}>
                {t.auth.loginTitle}
              </h2>
              <p className="text-[#64748b]">
                {locale === "ru" ? "Введите ваши данные для входа" : "Enter your credentials to sign in"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <Input
                label={t.auth.email}
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label={t.auth.password}
                type="password"
                placeholder={locale === "ru" ? "Введите пароль" : "Enter password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-[#64748b] transition-colors hover:text-[#C41E3A]">
                  {locale === "ru" ? "Забыли пароль?" : "Forgot password?"}
                </Link>
              </div>

              <Button type="submit" className="h-11 w-full" isLoading={isLoading}>
                <LogIn className="mr-2 h-4 w-4" />
                {t.auth.loginButton}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748b]">
                {t.auth.noAccount}{" "}
                <Link href="/register" className="font-medium text-[#C41E3A] hover:underline">
                  {t.auth.registerButton}
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-[#94a3b8]">
            Industry Skills Platform &copy; 2026
          </p>
        </div>
      </div>
    </div>
  )
}
