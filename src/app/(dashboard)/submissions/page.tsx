"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { Upload, Download, Trash2, FolderOpen, Calendar, Users, AlertCircle, FileText, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

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
}

interface SubmissionItem {
  event: {
    id: string
    name: string
    competency: string
    status: string
    eventStart: string
    eventEnd: string
  }
  team: {
    id: string
    name: string
    number: number | null
  }
  modules: ModuleItem[]
  files: TeamFile[]
  canUpload: boolean
}

export default function SubmissionsPage() {
  const { locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const [items, setItems] = useState<SubmissionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    const fetchSubmissions = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/my-submissions")
        if (!response.ok) {
          throw new Error("Failed to fetch submissions")
        }

        const data = await response.json()
        setItems(data)
      } catch (fetchError) {
        console.error("Error fetching submissions:", fetchError)
        setError(locale === "ru" ? "Не удалось загрузить работы" : "Failed to load submissions")
      } finally {
        setIsLoading(false)
      }
    }

    void fetchSubmissions()
  }, [locale])

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} ${locale === "ru" ? "Б" : "B"}`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ${locale === "ru" ? "КБ" : "KB"}`
    return `${(bytes / (1024 * 1024)).toFixed(1)} ${locale === "ru" ? "МБ" : "MB"}`
  }

  const statusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: locale === "ru" ? "Черновик" : "Draft",
      REGISTRATION_OPEN: locale === "ru" ? "Регистрация открыта" : "Registration Open",
      REGISTRATION_CLOSED: locale === "ru" ? "Регистрация закрыта" : "Registration Closed",
      IN_PROGRESS: locale === "ru" ? "В процессе" : "In Progress",
      SCORING: locale === "ru" ? "Оценивание" : "Scoring",
      RESULTS_PUBLISHED: locale === "ru" ? "Результаты опубликованы" : "Results Published",
      ARCHIVED: locale === "ru" ? "Архив" : "Archived",
    }
    return labels[status] || status
  }

  const uploadMessage = useMemo(
    () =>
      locale === "ru"
        ? "Загрузка доступна только в статусах «В процессе» и «Оценивание»."
        : 'Uploads are only available during "In Progress" and "Scoring" statuses.',
    [locale]
  )

  const handleFileUpload = async (teamId: string, moduleCode: string, file: File) => {
    const key = `${teamId}:${moduleCode}`
    setUploadingKey(key)
    setError("")
    setSuccess("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("moduleCode", moduleCode)

      const response = await fetch(`/api/teams/${teamId}/files`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Upload error")
      }

      setItems((prev) =>
        prev.map((item) =>
          item.team.id === teamId
            ? {
                ...item,
                files: [...item.files.filter((teamFile) => teamFile.moduleCode !== moduleCode), data],
              }
            : item
        )
      )

      setSuccess(
        locale === "ru"
          ? `Файл по модулю ${moduleCode} загружен`
          : `File for module ${moduleCode} uploaded`
      )
    } catch (uploadError) {
      console.error("Error uploading file:", uploadError)
      setError(locale === "ru" ? "Ошибка загрузки файла" : "File upload error")
    } finally {
      setUploadingKey(null)
    }
  }

  const handleDeleteFile = async (teamId: string, fileId: string, moduleCode: string) => {
    if (!confirm(locale === "ru" ? "Удалить загруженный файл?" : "Delete uploaded file?")) {
      return
    }

    try {
      const response = await fetch(`/api/teams/${teamId}/files?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Delete error")
      }

      setItems((prev) =>
        prev.map((item) =>
          item.team.id === teamId
            ? {
                ...item,
                files: item.files.filter((teamFile) => teamFile.id !== fileId),
              }
            : item
        )
      )

      setSuccess(
        locale === "ru"
          ? `Файл по модулю ${moduleCode} удалён`
          : `File for module ${moduleCode} deleted`
      )
    } catch (deleteError) {
      console.error("Error deleting file:", deleteError)
      setError(locale === "ru" ? "Ошибка удаления файла" : "File deletion error")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FolderOpen className="h-6 w-6 text-red-600" />
          {locale === "ru" ? "Работы команд" : "Team Submissions"}
        </h1>
        <p className="mt-1 text-gray-500">
          {locale === "ru"
            ? "Отдельный раздел для загрузки итоговых файлов по модулям."
            : "Dedicated area for uploading final files by module."}
        </p>
      </div>

      {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700">{success}</div>}

      {items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Вы пока не состоите ни в одной команде." : "You are not part of any team yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={`${item.event.id}:${item.team.id}`}>
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {item.event.name}
                    </CardTitle>
                    <p className="mt-1 text-sm text-red-600">{item.event.competency}</p>
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    {statusLabel(item.event.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 text-sm text-gray-600 sm:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {locale === "ru" ? "Команда" : "Team"}: {item.team.number ? `#${item.team.number} ` : ""}
                      {item.team.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(item.event.eventStart), "d MMM yyyy", { locale: dateLocale })} -{" "}
                      {format(new Date(item.event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                </div>

                {!item.canUpload && (
                  <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{uploadMessage}</span>
                  </div>
                )}
              </CardHeader>

              <CardContent>
                {item.modules.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {locale === "ru"
                      ? "Для этого мероприятия ещё не настроена схема оценивания."
                      : "Assessment schema is not configured for this event yet."}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {item.modules.map((module) => {
                      const existingFile = item.files.find((file) => file.moduleCode === module.code)
                      const inputKey = `${item.team.id}:${module.code}`
                      const isUploading = uploadingKey === inputKey

                      return (
                        <div key={module.id} className="rounded-xl border border-gray-200 p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">
                                {locale === "ru" ? "Модуль" : "Module"} {module.code}: {module.name}
                              </p>
                              {existingFile ? (
                                <div className="mt-1 space-y-1 text-sm text-gray-600">
                                  <p className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-green-600" />
                                    <span className="truncate">{existingFile.fileName}</span>
                                  </p>
                                  <p>
                                    {formatFileSize(existingFile.fileSize)} ·{" "}
                                    {format(new Date(existingFile.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                                  </p>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm text-gray-500">
                                  {locale === "ru" ? "Файл ещё не загружен." : "No file uploaded yet."}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {existingFile && (
                                <>
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={existingFile.fileUrl} target="_blank" rel="noopener noreferrer">
                                      <Download className="mr-2 h-4 w-4" />
                                      {locale === "ru" ? "Скачать" : "Download"}
                                    </a>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteFile(item.team.id, existingFile.id, module.code)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}

                              <input
                                ref={(element) => {
                                  fileInputRefs.current[inputKey] = element
                                }}
                                type="file"
                                className="hidden"
                                onChange={(event) => {
                                  const file = event.target.files?.[0]
                                  if (file) {
                                    void handleFileUpload(item.team.id, module.code, file)
                                  }
                                  event.currentTarget.value = ""
                                }}
                              />

                              <Button
                                size="sm"
                                variant={existingFile ? "outline" : "default"}
                                className="w-full sm:w-auto"
                                disabled={!item.canUpload || isUploading}
                                onClick={() => fileInputRefs.current[inputKey]?.click()}
                              >
                                {isUploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    {existingFile
                                      ? locale === "ru"
                                        ? "Заменить"
                                        : "Replace"
                                      : locale === "ru"
                                        ? "Загрузить"
                                        : "Upload"}
                                  </>
                                )}
                              </Button>
                            </div>
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
    </div>
  )
}
