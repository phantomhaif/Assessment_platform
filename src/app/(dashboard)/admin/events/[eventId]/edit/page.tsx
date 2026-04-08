"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImagePlus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/context"

type EventFormData = {
  name: string
  nameEn: string
  description: string
  descriptionEn: string
  competency: string
  competencyEn: string
  eventFormat: "ONLINE" | "OFFLINE"
  location: string
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
  maxTeamSize: number
  minTeamSize: number
}

type BackgroundLocale = "ru" | "en"

const EMPTY_FORM: EventFormData = {
  name: "",
  nameEn: "",
  description: "",
  descriptionEn: "",
  competency: "",
  competencyEn: "",
  eventFormat: "OFFLINE",
  location: "",
  registrationStart: "",
  registrationEnd: "",
  eventStart: "",
  eventEnd: "",
  maxTeamSize: 4,
  minTeamSize: 1,
}

export default function EditEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const router = useRouter()
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [backgroundError, setBackgroundError] = useState("")
  const [formData, setFormData] = useState<EventFormData>(EMPTY_FORM)
  const [passportBackgrounds, setPassportBackgrounds] = useState({
    ru: "",
    en: "",
  })
  const [uploadingBackgroundLocale, setUploadingBackgroundLocale] = useState<BackgroundLocale | null>(null)
  const [removingBackgroundLocale, setRemovingBackgroundLocale] = useState<BackgroundLocale | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch event")
        }

        const event = await response.json()
        setFormData({
          name: event.name,
          nameEn: event.nameEn || "",
          description: event.description || "",
          descriptionEn: event.descriptionEn || "",
          competency: event.competency,
          competencyEn: event.competencyEn || "",
          eventFormat: event.eventFormat || "OFFLINE",
          location: event.location || "",
          registrationStart: formatDateForInput(event.registrationStart),
          registrationEnd: formatDateForInput(event.registrationEnd),
          eventStart: formatDateForInput(event.eventStart),
          eventEnd: formatDateForInput(event.eventEnd),
          maxTeamSize: event.maxTeamSize,
          minTeamSize: event.minTeamSize,
        })
        setPassportBackgrounds({
          ru: event.passportBackgroundRu || "",
          en: event.passportBackgroundEn || "",
        })
      } catch (fetchError) {
        console.error("Error fetching event:", fetchError)
        setError(t.eventForm.saveError)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchEvent()
  }, [eventId, t.eventForm.saveError])

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString)
    return date.toISOString().slice(0, 16)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseInt(value, 10) || 0 : value,
    }))
  }

  const uploadPassportBackground = async (backgroundLocale: BackgroundLocale, file: File) => {
    setBackgroundError("")
    setUploadingBackgroundLocale(backgroundLocale)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)
      uploadFormData.append("locale", backgroundLocale)

      const response = await fetch(`/api/events/${eventId}/passport-background`, {
        method: "POST",
        body: uploadFormData,
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed")
      }

      setPassportBackgrounds((prev) => ({
        ...prev,
        [backgroundLocale]: payload.url,
      }))
    } catch (uploadError) {
      setBackgroundError(uploadError instanceof Error ? uploadError.message : "Upload failed")
    } finally {
      setUploadingBackgroundLocale(null)
    }
  }

  const removePassportBackground = async (backgroundLocale: BackgroundLocale) => {
    setBackgroundError("")
    setRemovingBackgroundLocale(backgroundLocale)

    try {
      const response = await fetch(`/api/events/${eventId}/passport-background?locale=${backgroundLocale}`, {
        method: "DELETE",
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Delete failed")
      }

      setPassportBackgrounds((prev) => ({
        ...prev,
        [backgroundLocale]: "",
      }))
    } catch (removeError) {
      setBackgroundError(removeError instanceof Error ? removeError.message : "Delete failed")
    } finally {
      setRemovingBackgroundLocale(null)
    }
  }

  const handlePassportBackgroundChange =
    (backgroundLocale: BackgroundLocale) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.currentTarget.value = ""

      if (!file) {
        return
      }

      await uploadPassportBackground(backgroundLocale, file)
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
        throw new Error(t.eventForm.saveError)
      }

      router.push(`/admin/events/${eventId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t.eventForm.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
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
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              label={locale === "ru" ? "Название мероприятия (EN)" : "Event name (EN)"}
              name="nameEn"
              value={formData.nameEn}
              onChange={handleChange}
            />
            <Input
              label={`${t.events.competency} *`}
              name="competency"
              value={formData.competency}
              onChange={handleChange}
              required
            />
            <Input
              label={locale === "ru" ? "Навык (EN)" : "Skill (EN)"}
              name="competencyEn"
              value={formData.competencyEn}
              onChange={handleChange}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {locale === "ru" ? "Описание (EN)" : "Description (EN)"}
              </label>
              <textarea
                name="descriptionEn"
                value={formData.descriptionEn}
                onChange={handleChange}
                rows={4}
                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{locale === "ru" ? "Фон skill passport" : "Skill passport background"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              {locale === "ru"
                ? "Фон хранится в настройках мероприятия. Если EN-фон не загружен, английский паспорт возьмет RU-фон."
                : "The background is stored in the event settings. If EN background is missing, the English passport will use the RU version."}
            </p>

            {backgroundError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {backgroundError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {([
                { key: "ru", label: "RU" },
                { key: "en", label: "EN" },
              ] as const).map((item) => {
                const imageUrl = passportBackgrounds[item.key]
                const isUploading = uploadingBackgroundLocale === item.key
                const isRemoving = removingBackgroundLocale === item.key

                return (
                  <div key={item.key} className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {locale === "ru" ? `Фон ${item.label}` : `${item.label} background`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {item.key === "en"
                            ? locale === "ru"
                              ? "Необязательно"
                              : "Optional"
                            : "PNG, JPG, WebP"}
                        </p>
                      </div>
                      {imageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePassportBackground(item.key)}
                          disabled={isUploading || isRemoving}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {locale === "ru" ? "Удалить" : "Remove"}
                        </Button>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={`Passport background ${item.label}`}
                          width={1200}
                          height={800}
                          unoptimized
                          className="h-48 w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center px-4 text-center text-sm text-gray-500">
                          {item.key === "en" && passportBackgrounds.ru
                            ? locale === "ru"
                              ? "Пока будет использоваться RU-фон."
                              : "RU background will be used for now."
                            : locale === "ru"
                              ? "Фон еще не загружен."
                              : "No background uploaded yet."}
                        </div>
                      )}
                    </div>

                    <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50">
                      <ImagePlus className="h-4 w-4" />
                      {isUploading
                        ? locale === "ru"
                          ? "Загрузка..."
                          : "Uploading..."
                        : locale === "ru"
                          ? "Загрузить изображение"
                          : "Upload image"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handlePassportBackgroundChange(item.key)}
                        disabled={isUploading || isRemoving}
                      />
                    </label>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>{t.eventForm.formatAndLocation || "Формат и место проведения"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {t.eventForm.eventFormat || "Формат мероприятия"} *
              </label>
              <select
                name="eventFormat"
                value={formData.eventFormat}
                onChange={handleChange}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C41E3A]"
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <Link href={`/admin/events/${eventId}`}>
            <Button type="button" variant="outline" className="w-full sm:w-auto">
              {t.common.cancel}
            </Button>
          </Link>
          <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
            {t.common.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
