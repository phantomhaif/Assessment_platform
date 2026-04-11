"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { Download, FileText, FolderOpen, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"
import { getLocalizedCompetency, getLocalizedEventName } from "@/lib/events"

interface EventOption {
  id: string
  name: string
  nameEn?: string | null
  status: string
}

interface ModuleItem {
  id: string
  code: string
  name: string
}

interface TeamFile {
  id: string
  moduleCode: string
  fileName: string
  fileUrl: string
  fileSize: number
  createdAt: string
  uploadedBy: {
    firstName: string
    lastName: string
  }
}

interface TeamItem {
  id: string
  name: string
  number: number | null
  members: {
    id: string
    user: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
  }[]
  files: TeamFile[]
}

interface AdminSubmissionsResponse {
  event: {
    id: string
    name: string
    nameEn?: string | null
    competency: string
    competencyEn?: string | null
    status: string
    eventStart: string
    eventEnd: string
  }
  modules: ModuleItem[]
  teams: TeamItem[]
}

export default function AdminSubmissionsPage() {
  const { locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEventId = searchParams.get("eventId") || ""

  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState(initialEventId)
  const [data, setData] = useState<AdminSubmissionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/events")
        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const eventsData = await response.json()
        setEvents(eventsData)

        if (!initialEventId && eventsData.length > 0) {
          setSelectedEventId(eventsData[0].id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        if (!selectedEventId) {
          setIsLoading(false)
        }
      }
    }

    void fetchEvents()
  }, [initialEventId, selectedEventId])

  useEffect(() => {
    if (selectedEventId) {
      const fetchSubmissions = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/admin/team-files?eventId=${selectedEventId}`)
          if (!response.ok) {
            throw new Error("Failed to fetch team files")
          }

          const result = await response.json()
          setData(result)
        } catch (error) {
          console.error("Error fetching team files:", error)
          setData(null)
        } finally {
          setIsLoading(false)
        }
      }

      void fetchSubmissions()
      router.replace(`/admin/submissions?eventId=${selectedEventId}`)
    } else {
      setData(null)
      setIsLoading(false)
    }
  }, [selectedEventId, router])

  const handleExport = async () => {
    if (!selectedEventId) return

    setIsExporting(true)
    try {
      const link = document.createElement("a")
      link.href = `/api/admin/team-files/export?eventId=${encodeURIComponent(selectedEventId)}`
      link.download = `${(data ? getLocalizedEventName(data.event, locale) : "team-submissions") || "team-submissions"}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (error) {
      console.error("Error exporting team files:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} ${locale === "ru" ? "Б" : "B"}`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${locale === "ru" ? "КБ" : "KB"}`
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${locale === "ru" ? "МБ" : "MB"}`
  }

  const stats = useMemo(() => {
    const teamsCount = data?.teams.length ?? 0
    const modulesCount = data?.modules.length ?? 0
    const filesCount = data?.teams.reduce((sum, team) => sum + team.files.length, 0) ?? 0
    return { teamsCount, modulesCount, filesCount }
  }, [data])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <FolderOpen className="h-6 w-6 text-red-600" />
            {locale === "ru" ? "Работы команд" : "Team Submissions"}
          </h1>
          <p className="mt-1 text-gray-500">
            {locale === "ru"
              ? "Просмотр и выгрузка итоговых файлов по модулям для любого чемпионата."
              : "Browse and export final module files for any event."}
          </p>
        </div>
        {selectedEventId && (
          <Button onClick={handleExport} isLoading={isExporting} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            {locale === "ru" ? "Скачать ZIP" : "Download ZIP"}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {locale === "ru" ? "Чемпионат" : "Event"}
              </label>
              <select
                value={selectedEventId}
                onChange={(event) => setSelectedEventId(event.target.value)}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{locale === "ru" ? "Выберите мероприятие" : "Select event"}</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {getLocalizedEventName(event, locale)}
                  </option>
                ))}
              </select>
            </div>
            {data && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">{locale === "ru" ? "Команды" : "Teams"}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stats.teamsCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">{locale === "ru" ? "Модули" : "Modules"}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stats.modulesCount}</p>
                </div>
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-400">{locale === "ru" ? "Файлы" : "Files"}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{stats.filesCount}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Выберите чемпионат для просмотра работ." : "Select an event to view submissions."}
          </CardContent>
        </Card>
      ) : !data ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Не удалось загрузить данные по работам." : "Failed to load submissions."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{getLocalizedEventName(data.event, locale)}</CardTitle>
              <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(data.event.eventStart), "d MMM yyyy", { locale: dateLocale })} -{" "}
                    {format(new Date(data.event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{getLocalizedCompetency(data.event, locale)}</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {data.teams.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">
                {locale === "ru" ? "Для этого мероприятия ещё нет команд." : "There are no teams for this event yet."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {data.teams.map((team) => (
                <Card key={team.id}>
                  <CardHeader className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {team.number ? `#${team.number} ` : ""}
                          {team.name}
                        </CardTitle>
                        <p className="mt-1 text-sm text-gray-500">
                          {team.members.length} {locale === "ru" ? "участник(ов)" : "member(s)"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {team.members.slice(0, 4).map((member) => (
                          <span key={member.id} className="rounded-full bg-gray-100 px-2 py-1">
                            {member.user.lastName} {member.user.firstName}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    {data.modules.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {locale === "ru"
                          ? "Схема оценивания для этого мероприятия ещё не загружена."
                          : "Assessment schema is not configured for this event yet."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.modules.map((module) => {
                          const file = team.files.find((teamFile) => teamFile.moduleCode === module.code)

                          return (
                            <div key={module.id} className="rounded-xl border border-gray-200 p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {locale === "ru" ? "Модуль" : "Module"} {module.code}: {module.name}
                                  </p>
                                  {file ? (
                                    <div className="mt-1 space-y-1 text-sm text-gray-600">
                                      <p className="truncate">{file.fileName}</p>
                                      <p>
                                        {formatFileSize(file.fileSize)} ·{" "}
                                        {locale === "ru" ? "загрузил" : "uploaded by"}{" "}
                                        {file.uploadedBy.lastName} {file.uploadedBy.firstName}
                                      </p>
                                      <p>
                                        {format(new Date(file.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                                      </p>
                                    </div>
                                  ) : (
                                    <p className="mt-1 text-sm text-gray-500">
                                      {locale === "ru" ? "Работа не загружена." : "No file uploaded."}
                                    </p>
                                  )}
                                </div>

                                {file && (
                                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto">
                                      <Download className="mr-2 h-4 w-4" />
                                      {locale === "ru" ? "Скачать" : "Download"}
                                    </Button>
                                  </a>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
