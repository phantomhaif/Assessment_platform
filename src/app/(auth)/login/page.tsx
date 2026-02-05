"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LogIn } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
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
        setError("Неверный email или пароль")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Произошла ошибка при входе")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="w-16 h-16 rounded-xl bg-[#0066cc] flex items-center justify-center mb-6">
              <span className="text-white font-bold text-2xl">IS</span>
            </div>
            <h1 className="text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
              Industry Skills
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Платформа оценивания
            </p>
            <p className="text-gray-400">
              Международные Чемпионаты по компетенциям профессионального мастерства
            </p>
          </div>

          <div className="space-y-4 text-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#0066cc]"></div>
              <span>Управление мероприятиями</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#0066cc]"></div>
              <span>Оценка участников</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#0066cc]"></div>
              <span>Skills Passports</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#f8fafc]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 rounded-xl bg-[#0066cc] flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">IS</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'var(--font-heading)' }}>
              Industry Skills
            </h1>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-[#e2e8f0] p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[#0f172a] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
                Вход в систему
              </h2>
              <p className="text-[#64748b]">
                Введите ваши данные для входа
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <Input
                label="Email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <Input
                label="Пароль"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Button type="submit" className="w-full h-11" isLoading={isLoading}>
                <LogIn className="w-4 h-4 mr-2" />
                Войти
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[#64748b]">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-[#0066cc] font-medium hover:underline">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-[#94a3b8] mt-6">
            Industry Skills Platform &copy; 2026
          </p>
        </div>
      </div>
    </div>
  )
}
