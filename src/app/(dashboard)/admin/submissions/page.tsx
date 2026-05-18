"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { Download, FileText, FolderOpen, Calendar, Camera } from "lucide-react"
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
  nameEn?: string | null
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
      photo: string | null
    }
  }[]
  files: TeamFile[]
  photos: {
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
    caption: string | null
    createdAt: string
  }[]
  adminFlags: {
    key: string
    value: boolean
    note: string | null
    updatedAt: string
  }[]
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

interface ExportStatus {
  id: string
  name: string
  teamFilesExportStatus: string | null
  teamFilesExportTotal: number
  teamFilesExportCompleted: number
  teamFilesExportError: string | null
  teamFilesExportStartedAt: string | null
  teamFilesExportFinishedAt: string | null
  teamFilesExportCachedAt: string | null
  ready: boolean
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
  const [exportStatus, setExportStatus] = useState<ExportStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [shouldAutoDownload, setShouldAutoDownload] = useState(false)
  const [showMissingFirst, setShowMissingFirst] = useState(true)
  const getModuleName = (module: ModuleItem) => (locale === "en" ? module.nameEn || module.name : module.name)

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

  const fetchExportStatus = async (eventId: string) => {
    try {
      const response = await fetch(`/api/admin/team-files/export?eventId=${encodeURIComponent(eventId)}`)
      if (!response.ok) {
        throw new Error("Failed to fetch export status")
      }

      const result = await response.json()
      setExportStatus(result)
      return result as ExportStatus
    } catch (error) {
      console.error("Error fetching export status:", error)
      return null
    }
  }

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
          await fetchExportStatus(selectedEventId)
        } catch (error) {
          console.error("Error fetching team files:", error)
          setData(null)
          setExportStatus(null)
        } finally {
          setIsLoading(false)
        }
      }

      void fetchSubmissions()
      router.replace(`/admin/submissions?eventId=${selectedEventId}`)
    } else {
      setData(null)
      setExportStatus(null)
      setIsLoading(false)
    }
  }, [selectedEventId, router])

  useEffect(() => {
    if (!selectedEventId || exportStatus?.teamFilesExportStatus !== "RUNNING") {
      return
    }

    const intervalId = window.setInterval(() => {
      void fetchExportStatus(selectedEventId)
    }, 4000)

    return () => window.clearInterval(intervalId)
  }, [selectedEventId, exportStatus?.teamFilesExportStatus])

  useEffect(() => {
    if (!selectedEventId || !shouldAutoDownload || !exportStatus?.ready) {
      return
    }

    const link = document.createElement("a")
    link.href = `/api/admin/team-files/export?eventId=${encodeURIComponent(selectedEventId)}&download=1`
    document.body.appendChild(link)
    link.click()
    link.remove()

    setShouldAutoDownload(false)
    setIsExporting(false)
  }, [selectedEventId, shouldAutoDownload, exportStatus?.ready])

  useEffect(() => {
    if (exportStatus?.teamFilesExportStatus === "FAILED") {
      setShouldAutoDownload(false)
      setIsExporting(false)
    }
  }, [exportStatus?.teamFilesExportStatus])

  const startDownload = () => {
    if (!selectedEventId) return

    const link = document.createElement("a")
    link.href = `/api/admin/team-files/export?eventId=${encodeURIComponent(selectedEventId)}&download=1`
    link.download = `${(data ? getLocalizedEventName(data.event, locale) : "team-submissions") || "team-submissions"}.zip`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleExport = async () => {
    if (!selectedEventId) return

    if (exportStatus?.ready) {
      startDownload()
      return
    }

    setIsExporting(true)
    setShouldAutoDownload(true)

    try {
      const response = await fetch(`/api/admin/team-files/export?eventId=${encodeURIComponent(selectedEventId)}`, {
        method: "POST",
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Export start failed")
      }

      if (payload?.status) {
        setExportStatus(payload.status)
      } else {
        await fetchExportStatus(selectedEventId)
      }

      if (payload?.ready) {
        startDownload()
        setShouldAutoDownload(false)
        setIsExporting(false)
      }
    } catch (error) {
      console.error("Error exporting team files:", error)
      setShouldAutoDownload(false)
      setIsExporting(false)
    }
  }

  const updateObsFlag = async (teamId: string, value: boolean) => {
    if (!data) return

    setData({
      ...data,
      teams: data.teams.map((team) =>
        team.id === teamId
          ? {
              ...team,
              adminFlags: [{ key: "obs_submitted", value, note: null, updatedAt: new Date().toISOString() }],
            }
          : team
      ),
    })

    try {
      const response = await fetch(`/api/admin/teams/${teamId}/flags`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "obs_submitted", value }),
      })

      if (!response.ok) {
        throw new Error("Failed to update flag")
      }
    } catch (error) {
      console.error("Error updating OBS flag:", error)
      if (selectedEventId) {
        const response = await fetch(`/api/admin/team-files?eventId=${selectedEventId}`)
        if (response.ok) {
          setData(await response.json())
        }
      }
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} ${locale === "ru" ? "Б" : "B"}`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${locale === "ru" ? "КБ" : "KB"}`
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${locale === "ru" ? "МБ" : "MB"}`
  }

  const formatEta = (seconds: number) => {
    const rounded = Math.max(1, Math.round(seconds))
    if (rounded < 60) {
      return locale === "ru" ? `около ${rounded} сек.` : `about ${rounded}s`
    }

    const minutes = Math.floor(rounded / 60)
    const remainSeconds = rounded % 60

    if (remainSeconds === 0) {
      return locale === "ru" ? `около ${minutes} мин.` : `about ${minutes} min`
    }

    return locale === "ru"
      ? `около ${minutes} мин. ${remainSeconds} сек.`
      : `about ${minutes} min ${remainSeconds}s`
  }

  const stats = useMemo(() => {
    const teamsCount = data?.teams.length ?? 0
    const modulesCount = data?.modules.length ?? 0
    const filesCount = data?.teams.reduce((sum, team) => sum + team.files.length, 0) ?? 0
    return { teamsCount, modulesCount, filesCount }
  }, [data])

  const sortedTeams = useMemo(() => {
    if (!data) return []

    const getMissingModulesCount = (team: TeamItem) =>
      data.modules.filter((module) => !team.files.some((file) => file.moduleCode === module.code)).length

    return [...data.teams].sort((left, right) => {
      if (showMissingFirst) {
        const leftMissing = getMissingModulesCount(left)
        const rightMissing = getMissingModulesCount(right)
        if (leftMissing !== rightMissing) return rightMissing - leftMissing
      }

      const leftNumber = left.number ?? Number.MAX_SAFE_INTEGER
      const rightNumber = right.number ?? Number.MAX_SAFE_INTEGER
      if (leftNumber !== rightNumber) return leftNumber - rightNumber

      return left.name.localeCompare(right.name, locale === "ru" ? "ru" : "en")
    })
  }, [data, locale, showMissingFirst])

  const exportPercent =
    exportStatus && exportStatus.teamFilesExportTotal > 0
      ? Math.min(100, Math.round((exportStatus.teamFilesExportCompleted / exportStatus.teamFilesExportTotal) * 100))
      : 0

  const exportEtaSeconds = useMemo(() => {
    if (
      !exportStatus ||
      exportStatus.teamFilesExportStatus !== "RUNNING" ||
      !exportStatus.teamFilesExportStartedAt ||
      exportStatus.teamFilesExportCompleted <= 0 ||
      exportStatus.teamFilesExportCompleted >= exportStatus.teamFilesExportTotal
    ) {
      return null
    }

    const elapsedMs = Date.now() - new Date(exportStatus.teamFilesExportStartedAt).getTime()
    if (elapsedMs <= 0) {
      return null
    }

    const msPerStep = elapsedMs / exportStatus.teamFilesExportCompleted
    const remainingSteps = exportStatus.teamFilesExportTotal - exportStatus.teamFilesExportCompleted

    return Math.round((msPerStep * remainingSteps) / 1000)
  }, [
    exportStatus?.teamFilesExportStartedAt,
    exportStatus?.teamFilesExportStatus,
    exportStatus?.teamFilesExportCompleted,
    exportStatus?.teamFilesExportTotal,
  ])

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
            {exportStatus?.ready
              ? locale === "ru"
                ? "Скачать ZIP"
                : "Download ZIP"
              : locale === "ru"
                ? "Подготовить ZIP"
                : "Prepare ZIP"}
          </Button>
        )}
      </div>

      {selectedEventId && exportStatus && (
        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {locale === "ru" ? "Архив работ команд" : "Team submissions archive"}
                </p>
                <p className="text-xs text-gray-500">
                  {exportStatus.teamFilesExportStatus === "RUNNING"
                    ? locale === "ru"
                      ? "Сервер собирает ZIP и обновляет прогресс по мере упаковки."
                      : "The server is building the ZIP and updating progress while packing files."
                    : exportStatus.ready
                      ? locale === "ru"
                        ? "Готовый архив уже лежит в кэше и будет скачан сразу."
                        : "The archive is cached and ready for immediate download."
                      : exportStatus.teamFilesExportStatus === "FAILED"
                        ? locale === "ru"
                          ? "Подготовка архива завершилась с ошибкой."
                          : "Archive preparation failed."
                        : locale === "ru"
                          ? "Архив еще не подготовлен. Нажмите кнопку, чтобы собрать его в фоне."
                          : "The archive is not prepared yet. Start background generation with the button."}
                </p>
              </div>
              <div className="text-sm font-medium text-gray-700">
                {exportStatus.teamFilesExportCompleted}/{exportStatus.teamFilesExportTotal}
              </div>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#C41E3A] transition-all"
                style={{ width: `${exportPercent}%` }}
              />
            </div>

            <div className="flex flex-col gap-1 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {locale === "ru" ? "Прогресс:" : "Progress:"} {exportPercent}%
              </span>
              <span>
                {exportStatus.teamFilesExportStatus === "RUNNING" && exportEtaSeconds
                  ? locale === "ru"
                    ? `Осталось ${formatEta(exportEtaSeconds)}`
                    : `${formatEta(exportEtaSeconds)} remaining`
                  : exportStatus.ready
                    ? locale === "ru"
                      ? "Архив готов к скачиванию"
                      : "Archive is ready to download"
                    : exportStatus.teamFilesExportStatus === "FAILED"
                      ? locale === "ru"
                        ? "Подготовка не завершена"
                        : "Preparation did not complete"
                      : locale === "ru"
                        ? "Ожидает запуска"
                        : "Waiting to start"}
              </span>
            </div>

            {exportStatus.teamFilesExportError && (
              <p className="text-sm text-red-600">{exportStatus.teamFilesExportError}</p>
            )}
          </CardContent>
        </Card>
      )}

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
                {locale === "ru" ? "Для этого мероприятия еще нет команд." : "There are no teams for this event yet."}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {locale === "ru" ? "Порядок команд" : "Team order"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {locale === "ru"
                        ? "Можно поднять наверх команды, у которых не загружены работы по модулям."
                        : "Move teams with missing module uploads to the top."}
                    </p>
                  </div>
                  <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
                    <input
                      type="checkbox"
                      checked={showMissingFirst}
                      onChange={(event) => setShowMissingFirst(event.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    {locale === "ru" ? "Сначала несданные" : "Missing first"}
                  </label>
                </CardContent>
              </Card>

              {sortedTeams.map((team) => {
                  const uploadedModules = new Set(team.files.map((file) => file.moduleCode))
                  const missingModulesCount = data.modules.filter((module) => !uploadedModules.has(module.code)).length
                  const obsSubmitted = team.adminFlags.some((flag) => flag.key === "obs_submitted" && flag.value)

                  return (
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
                        {data.modules.length > 0 && (
                          <p className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                            missingModulesCount > 0
                              ? "bg-rose-100 text-rose-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {locale === "ru" ? "Загружено" : "Uploaded"} {data.modules.length - missingModulesCount}/{data.modules.length}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                        {team.members.slice(0, 4).map((member) => (
                          <span key={member.id} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1">
                            {member.user.photo ? (
                              <img src={member.user.photo} alt="" className="h-5 w-4 rounded-sm object-cover" />
                            ) : null}
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
                          ? "Схема оценивания для этого мероприятия еще не загружена."
                          : "Assessment schema is not configured for this event yet."}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {data.modules.map((module) => {
                          const file = team.files.find((teamFile) => teamFile.moduleCode === module.code)

                          return (
                            <div
                              key={module.id}
                              className={`rounded-xl border p-4 ${
                                file
                                  ? "border-gray-200"
                                  : "border-rose-200 bg-rose-50/70"
                              }`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-medium text-gray-900">
                                    {locale === "ru" ? "Модуль" : "Module"} {module.code}: {getModuleName(module)}
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
                                    <p className="mt-2 inline-flex rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-700">
                                      {locale === "ru" ? "Не загружено" : "Not uploaded"}
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
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <label className="flex items-center gap-3 text-sm font-medium text-gray-800">
                            <input
                              type="checkbox"
                              checked={obsSubmitted}
                              onChange={(event) => updateObsFlag(team.id, event.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            {locale === "ru" ? "OBS сдан мне" : "OBS submitted"}
                          </label>
                        </div>
                        {team.photos.length > 0 && (
                          <div className="rounded-xl border border-gray-200 p-4">
                            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-900">
                              <Camera className="h-4 w-4 text-gray-500" />
                              {locale === "ru" ? "Фотоотчёт" : "Photo report"}
                            </p>
                            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                              {team.photos.slice(0, 12).map((photo) => (
                                <a key={photo.id} href={photo.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <img src={photo.fileUrl} alt={photo.fileName} className="aspect-square rounded-lg object-cover" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                  )
                })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
