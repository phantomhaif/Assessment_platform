"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewEventPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    competency: "",
    registrationStart: "",
    registrationEnd: "",
    eventStart: "",
    eventEnd: "",
    maxTeamSize: 4,
    minTeamSize: 1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Ошибка создания мероприятия")
      }

      const event = await response.json()
      router.push(`/admin/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка создания мероприятия")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Создание мероприятия</h1>
          <p className="text-gray-500 mt-1">Заполните информацию о соревновании</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Название мероприятия *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Международный Чемпионат Robotics skills 2025"
              required
            />

            <Input
              label="Компетенция *"
              name="competency"
              value={formData.competency}
              onChange={handleChange}
              placeholder="Цифровое производство"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Описание мероприятия..."
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Даты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начало регистрации *"
                name="registrationStart"
                type="datetime-local"
                value={formData.registrationStart}
                onChange={handleChange}
                required
              />
              <Input
                label="Конец регистрации *"
                name="registrationEnd"
                type="datetime-local"
                value={formData.registrationEnd}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начало мероприятия *"
                name="eventStart"
                type="datetime-local"
                value={formData.eventStart}
                onChange={handleChange}
                required
              />
              <Input
                label="Конец мероприятия *"
                name="eventEnd"
                type="datetime-local"
                value={formData.eventEnd}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Настройки команд</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Мин. размер команды"
                name="minTeamSize"
                type="number"
                min={1}
                value={formData.minTeamSize}
                onChange={handleChange}
              />
              <Input
                label="Макс. размер команды"
                name="maxTeamSize"
                type="number"
                min={1}
                value={formData.maxTeamSize}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href="/admin/events">
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading}>
            Создать мероприятие
          </Button>
        </div>
      </form>
    </div>
  )
}
