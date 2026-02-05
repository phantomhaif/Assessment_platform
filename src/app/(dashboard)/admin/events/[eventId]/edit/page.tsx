"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const event = await response.json()
        setFormData({
          name: event.name,
          description: event.description || "",
          competency: event.competency,
          registrationStart: formatDateForInput(event.registrationStart),
          registrationEnd: formatDateForInput(event.registrationEnd),
          eventStart: formatDateForInput(event.eventStart),
          eventEnd: formatDateForInput(event.eventEnd),
          maxTeamSize: event.maxTeamSize,
          minTeamSize: event.minTeamSize,
        })
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value) || 0 : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSaving(true)

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          registrationStart: new Date(formData.registrationStart).toISOString(),
          registrationEnd: new Date(formData.registrationEnd).toISOString(),
          eventStart: new Date(formData.eventStart).toISOString(),
          eventEnd: new Date(formData.eventEnd).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("Ошибка сохранения")
      }

      router.push(`/admin/events/${eventId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Редактирование мероприятия</h1>
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
              required
            />
            <Input
              label="Компетенция *"
              name="competency"
              value={formData.competency}
              onChange={handleChange}
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
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
                label="Начало регистрации"
                name="registrationStart"
                type="datetime-local"
                value={formData.registrationStart}
                onChange={handleChange}
              />
              <Input
                label="Конец регистрации"
                name="registrationEnd"
                type="datetime-local"
                value={formData.registrationEnd}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начало мероприятия"
                name="eventStart"
                type="datetime-local"
                value={formData.eventStart}
                onChange={handleChange}
              />
              <Input
                label="Конец мероприятия"
                name="eventEnd"
                type="datetime-local"
                value={formData.eventEnd}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Настройки команд</CardTitle>
          </CardHeader>
          <CardContent>
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
          <Link href={`/admin/events/${eventId}`}>
            <Button type="button" variant="outline">
              Отмена
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            Сохранить изменения
          </Button>
        </div>
      </form>
    </div>
  )
}
