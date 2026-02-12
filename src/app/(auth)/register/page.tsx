"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"

export default function RegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают")
      return
    }

    if (!formData.agreedToTerms || !formData.agreedToDataProcessing) {
      setError("Необходимо принять условия и дать согласие на обработку данных")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Ошибка регистрации")
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Регистрация</CardTitle>
          <CardDescription>
            Создайте аккаунт для участия в соревнованиях
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Фамилия *"
                name="lastName"
                placeholder="Иванов"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label="Имя *"
                name="firstName"
                placeholder="Иван"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <Input
              label="Отчество"
              name="middleName"
              placeholder="Иванович"
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
              label="Организация / Учебное заведение"
              name="organization"
              placeholder="МИРЭА — Российский технологический университет"
              value={formData.organization}
              onChange={handleChange}
            />

            <Input
              label="Телефон"
              type="tel"
              name="phone"
              placeholder="+7 (999) 123-45-67"
              value={formData.phone}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Пароль *"
                type="password"
                name="password"
                placeholder="Минимум 6 символов"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
              />
              <Input
                label="Повторите пароль *"
                type="password"
                name="confirmPassword"
                placeholder="Повторите пароль"
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
                    Я принимаю{" "}
                    <a href="/terms" className="text-red-600 hover:underline">
                      условия использования
                    </a>
                  </span>
                }
              />
              <Checkbox
                name="agreedToDataProcessing"
                checked={formData.agreedToDataProcessing}
                onChange={handleChange}
                label="Я даю согласие на обработку персональных данных"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" isLoading={isLoading}>
              Зарегистрироваться
            </Button>
            <p className="text-sm text-gray-600 text-center">
              Уже есть аккаунт?{" "}
              <Link href="/login" className="text-red-600 hover:underline">
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
