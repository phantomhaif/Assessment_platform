"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface PartnerLogo {
  url: string
  name?: string
}

function parsePartnerLogos(raw: string | null | undefined): PartnerLogo[] {
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => ({
        url: typeof item?.url === "string" ? item.url.trim() : "",
        name: typeof item?.name === "string" ? item.name.trim() : "",
      }))
      .filter((item) => item.url.length > 0)
      .slice(0, 12)
  } catch {
    const trimmed = raw.trim()
    if (trimmed.startsWith("/api/files/") || /^https?:\/\//.test(trimmed)) {
      return [{ url: trimmed, name: "" }]
    }
    return []
  }
}

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const { t } = useI18n()
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [error, setError] = useState("")
  const [partnerLogos, setPartnerLogos] = useState<PartnerLogo[]>([])

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    competency: "",
    eventFormat: "OFFLINE" as "ONLINE" | "OFFLINE",
    location: "",
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
          eventFormat: event.eventFormat || "OFFLINE",
          location: event.location || "",
          registrationStart: formatDateForInput(event.registrationStart),
          registrationEnd: formatDateForInput(event.registrationEnd),
          eventStart: formatDateForInput(event.eventStart),
          eventEnd: formatDateForInput(event.eventEnd),
          maxTeamSize: event.maxTeamSize,
          minTeamSize: event.minTeamSize,
        })
        setPartnerLogos(parsePartnerLogos(event.logo))
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          logo: partnerLogos.length > 0 ? JSON.stringify(partnerLogos) : null,
          registrationStart: new Date(formData.registrationStart).toISOString(),
          registrationEnd: new Date(formData.registrationEnd).toISOString(),
          eventStart: new Date(formData.eventStart).toISOString(),
          eventEnd: new Date(formData.eventEnd).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error(t.eventForm.saveError)
      }

      router.push(`/admin/events/${eventId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.eventForm.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePartnerLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError("")
    setIsUploadingLogo(true)

    try {
      const payload = new FormData()
      payload.append("file", file)
      payload.append("type", "partner-logo")

      const response = await fetch("/api/upload", {
        method: "POST",
        body: payload,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Не удалось загрузить логотип")
      }

      const data = await response.json()
      const defaultName = file.name.replace(/\.[^.]+$/, "")
      setPartnerLogos((prev) => [...prev, { url: data.url, name: defaultName }])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось загрузить логотип")
    } finally {
      setIsUploadingLogo(false)
      if (e.target) e.target.value = ""
    }
  }

  const handlePartnerLogoNameChange = (index: number, name: string) => {
    setPartnerLogos((prev) =>
      prev.map((logo, i) => (i === index ? { ...logo, name } : logo))
    )
  }

  const movePartnerLogo = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= partnerLogos.length) return

    setPartnerLogos((prev) => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const removePartnerLogo = (index: number) => {
    setPartnerLogos((prev) => prev.filter((_, i) => i !== index))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">{t.eventForm.editTitle}</h1>
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
              required
            />
            <Input
              label={`${t.events.competency} *`}
              name="competency"
              value={formData.competency}
              onChange={handleChange}
              required
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
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
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
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t.events.registrationStart}
                name="registrationStart"
                type="datetime-local"
                value={formData.registrationStart}
                onChange={handleChange}
              />
              <Input
                label={t.events.registrationEnd}
                name="registrationEnd"
                type="datetime-local"
                value={formData.registrationEnd}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={t.events.eventStart}
                name="eventStart"
                type="datetime-local"
                value={formData.eventStart}
                onChange={handleChange}
              />
              <Input
                label={t.events.eventEnd}
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
            <CardTitle>{t.eventForm.teamSettings}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
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

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Логотипы партнеров для паспорта</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Загрузите логотипы спонсоров для конкретного мероприятия. Они будут использованы в верхней полосе PDF-паспорта.
            </p>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                isLoading={isUploadingLogo}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                Добавить логотип
              </Button>
              <span className="text-sm text-gray-500">Всего: {partnerLogos.length}</span>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                className="hidden"
                onChange={handlePartnerLogoUpload}
              />
            </div>

            {partnerLogos.length === 0 ? (
              <p className="text-sm text-gray-500">
                Логотипы не добавлены. Будут использованы значения шаблона по умолчанию.
              </p>
            ) : (
              <div className="space-y-3">
                {partnerLogos.map((logo, index) => (
                  <div
                    key={`${logo.url}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    <img
                      src={logo.url}
                      alt={logo.name || `Логотип ${index + 1}`}
                      className="h-12 w-20 rounded border border-gray-200 object-contain bg-white"
                    />
                    <Input
                      value={logo.name || ""}
                      onChange={(e) => handlePartnerLogoNameChange(index, e.target.value)}
                      placeholder="Название партнера (опционально)"
                    />
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => movePartnerLogo(index, -1)}
                        disabled={index === 0}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => movePartnerLogo(index, 1)}
                        disabled={index === partnerLogos.length - 1}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePartnerLogo(index)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 mt-6">
          <Link href={`/admin/events/${eventId}`}>
            <Button type="button" variant="outline">
              {t.common.cancel}
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
