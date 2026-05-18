"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Eye, Lock, LogIn, Mail } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformDescription, getPlatformName } from "@/lib/brand"

export default function LoginPage() {
  const router = useRouter()
  const { t, locale, setLocale } = useI18n()
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
    <main className="login-wrap">
      <Link href="/" className="auth-back-link">
        <ArrowLeft className="h-3.5 w-3.5" />
        // {locale === "ru" ? "на главную" : "home"}
      </Link>

      <section className="auth-left-panel">
        <div className="auth-grid" />
        <div className="auth-accent" />
        <div className="orb orb-a" />
        <div className="orb orb-b" />
        <div className="scan" />

        <div className="auth-center-stage">
          <div className="center-bracket center-bracket-1" />
          <div className="center-bracket center-bracket-2" />
          <div className="center-bracket center-bracket-3" />
          <div className="center-bracket center-bracket-4" />
          <div className="center-halo-out" />
          <div className="center-halo-in" />
          <div className="center-halo-mid" />
          <div className="logo-card">
            <div className="logo-card-inner">
              <Image src="/logo.png" alt="Industry Skills" width={100} height={100} priority />
            </div>
          </div>
        </div>

        <div className="auth-left-copy">
          <div className="badge-chip">
            <span className="badge-dot" />
            <span className="mono text-[9px] uppercase tracking-[0.12em] text-[#6b7f94]">WorldSkills Standard</span>
          </div>
          <h1 className="auth-left-title">
            {locale === "ru" ? "Платформа" : "Assessment"}
            <br />
            {locale === "ru" ? "оценки " : "platform "}
            <span className="auth-left-title-em">{locale === "ru" ? "знаний" : "runtime"}</span>
          </h1>
          <p className="auth-left-desc">{getPlatformDescription(locale)}</p>
          <div className="auth-left-features">
            <FeatureText>{locale === "ru" ? "Управление мероприятиями" : "Event management"}</FeatureText>
            <FeatureText>{locale === "ru" ? "Онлайн-оценивание участников" : "Online participant scoring"}</FeatureText>
            <FeatureText>{locale === "ru" ? "Автогенерация Skill Passport PDF" : "Skill Passport PDF generation"}</FeatureText>
          </div>
          <div className="auth-left-divider">
            <span className="mono text-[8px] uppercase tracking-[0.18em] text-[#C41E3A]">// verified</span>
            <div className="h-px flex-1 bg-gradient-to-r from-[#C41E3A] to-transparent" />
            <span className="text-[10px] text-[#6b7f94]">ИИТБ · Industry Skills</span>
          </div>
        </div>
      </section>

      <section className="auth-right-panel">
        <button
          onClick={() => setLocale(locale === "ru" ? "en" : "ru")}
          className="auth-lang-btn"
          type="button"
        >
          {locale === "ru" ? "EN" : "RU"}
        </button>

        <div className="auth-form-box">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/logo.png" alt="Industry Skills" width={46} height={46} />
            <div>
              <div className="font-heading text-sm font-bold uppercase tracking-[0.12em] text-white">Industry Skills</div>
              <div className="mono mt-1 text-[8px] uppercase tracking-[0.16em] text-[#6b7f94]">{platformName}</div>
            </div>
          </div>

          <h2 className="auth-form-title">{t.auth.loginTitle}</h2>
          <p className="auth-form-sub">
            {locale === "ru" ? "Введите ваши данные для входа" : "Enter your credentials to sign in"}
          </p>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="auth-form-error">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff8da3]" />
                {error}
              </div>
            )}

            <label className="auth-field">
              <span className="auth-field-label">{t.auth.email}</span>
              <span className="auth-input-wrap">
                <Mail className="auth-input-icon h-4 w-4" />
                <input
                  className="auth-input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </span>
            </label>

            <label className="auth-field">
              <span className="auth-field-label">{t.auth.password}</span>
              <span className="auth-input-wrap">
                <Lock className="auth-input-icon h-4 w-4" />
                <input
                  className="auth-input auth-input-pass"
                  type="password"
                  placeholder={locale === "ru" ? "Введите пароль" : "Enter password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Eye className="auth-pass-eye h-4 w-4" aria-hidden="true" />
              </span>
            </label>

            <div className="auth-forgot">
              <Link href="/forgot-password">
                {locale === "ru" ? "Забыли пароль?" : "Forgot password?"}
              </Link>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              <LogIn className="h-4 w-4" />
              {isLoading ? (locale === "ru" ? "Вход..." : "Signing in...") : t.auth.loginButton}
            </button>
          </form>

          <p className="auth-register">
            {t.auth.noAccount}{" "}
            <Link href="/register">{t.auth.registerButton}</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

function FeatureText({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-left-feature">
      <span className="auth-left-feature-dot" />
      {children}
    </div>
  )
}
