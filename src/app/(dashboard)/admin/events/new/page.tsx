"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"

export default function NewEventPage() {
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    description: "",
    competency: "",
    competencyEn: "",
    eventFormat: "OFFLINE" as "ONLINE" | "OFFLINE",
    location: "",
    registrationStart: "",
    registrationEnd: "",
    eventStart: "",
    eventEnd: "",
    maxTeamSize: 4,
    minTeamSize: 1,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
        throw new Error(data.error || t.eventForm.createError)
      }

      const event = await response.json()
      router.push(`/admin/events/${event.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.eventForm.createError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Link href="/admin/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.eventForm.createTitle}</h1>
          <p className="text-gray-500 mt-1">{t.eventForm.createSubtitle}</p>
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
            <CardTitle>{t.eventForm.mainInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={`${t.events.eventName} *`}
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder={t.eventForm.eventNamePlaceholder}
              required
            />

            <Input
              label={locale === "ru" ? "Название мероприятия (EN)" : "Event name (EN)"}
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
              placeholder="Event name in English"
            />

            <Input
              label={`${t.events.competency} *`}
              name="competency"
              value={formData.competency}
              onChange={handleChange}
              placeholder={t.eventForm.competencyPlaceholder}
              required
            />

            <Input
              label={locale === "ru" ? "Компетенция (EN)" : "Competency (EN)"}
              name="competencyEn"
              value={formData.competencyEn}
              onChange={handleChange}
              placeholder="Competency in English"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.common.description}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder={t.eventForm.descriptionPlaceholder}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.eventForm.formatAndLocation || "Формат и место проведения"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.eventForm.eventFormat || "Формат мероприятия"} *
              </label>
              <select
                name="eventFormat"
                value={formData.eventFormat}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
                required
              >
                <option value="OFFLINE">{t.eventForm.offline || "Очное"}</option>
                <option value="ONLINE">{t.eventForm.online || "Онлайн"}</option>
              </select>
            </div>

            {formData.eventFormat === "OFFLINE" && (
              <Input
                label={t.eventForm.location || "Место проведения"}
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder={t.eventForm.locationPlaceholder || "Санкт-Петербург, ул. Примерная, д. 1"}
              />
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.eventForm.dates}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={`${t.events.registrationStart} *`}
                name="registrationStart"
                type="datetime-local"
                value={formData.registrationStart}
                onChange={handleChange}
                required
              />
              <Input
                label={`${t.events.registrationEnd} *`}
                name="registrationEnd"
                type="datetime-local"
                value={formData.registrationEnd}
                onChange={handleChange}
                required
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={`${t.events.eventStart} *`}
                name="eventStart"
                type="datetime-local"
                value={formData.eventStart}
                onChange={handleChange}
                required
              />
              <Input
                label={`${t.events.eventEnd} *`}
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
            <CardTitle>{t.eventForm.teamSettings}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label={t.eventForm.minTeamSize}
                name="minTeamSize"
                type="number"
                min={1}
                value={formData.minTeamSize}
                onChange={handleChange}
              />
              <Input
                label={t.eventForm.maxTeamSize}
                name="maxTeamSize"
                type="number"
                min={1}
                value={formData.maxTeamSize}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/admin/events">
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              {t.common.cancel}
            </Button>
          </Link>
          <Button type="submit" isLoading={isLoading} className="w-full sm:w-auto">
            {t.events.createEvent}
          </Button>
        </div>
      </form>
    </div>
  )
}
