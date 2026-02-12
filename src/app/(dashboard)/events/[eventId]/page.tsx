"use client"

import { useState, useEffect, use, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ArrowLeft, Calendar, Users, Clock, CheckCircle, XCircle, Loader2,
  FileText, Download, Upload, File, Trash2
} from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface Event {
  id: string
  name: string
  description: string | null
  competency: string
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
  status: string
  maxTeamSize: number
  minTeamSize: number
  _count: {
    teams: number
    applications: number
  }
}

interface Application {
  id: string
  status: string
  agreedToRegulation: boolean
  comment: string | null
  createdAt: string
}

interface Document {
  id: string
  name: string
  type: string
  access: string
  fileUrl: string
  version: number
  createdAt: string
}

interface Module {
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

interface TeamInfo {
  id: string
  name: string
  number: number | null
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [event, setEvent] = useState<Event | null>(null)
  const [application, setApplication] = useState<Application | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [teamFiles, setTeamFiles] = useState<TeamFile[]>([])
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadingModule, setUploadingModule] = useState<string | null>(null)
  const [agreedToRegulation, setAgreedToRegulation] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetchData()
  }, [eventId])

  const fetchData = async () => {
    try {
      const [eventRes, appRes, docsRes] = await Promise.all([
        fetch(`/api/events/${eventId}`),
        fetch(`/api/events/${eventId}/applications`),
        fetch(`/api/events/${eventId}/documents`),
      ])

      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData)
      }

      if (appRes.ok) {
        const appData = await appRes.json()
        setApplication(appData)

        // If application is approved, fetch team info and modules
        if (appData?.status === "APPROVED") {
          const [teamRes, modulesRes] = await Promise.all([
            fetch(`/api/events/${eventId}/my-team`),
            fetch(`/api/events/${eventId}/modules`),
          ])

          if (teamRes.ok) {
            const teamData = await teamRes.json()
            setTeamInfo(teamData)

            // Fetch team files
            const filesRes = await fetch(`/api/teams/${teamData.id}/files`)
            if (filesRes.ok) {
              const filesData = await filesRes.json()
              setTeamFiles(filesData)
            }
          }

          if (modulesRes.ok) {
            const modulesData = await modulesRes.json()
            setModules(modulesData)
          }
        }
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json()
        // Filter documents that are visible to participants
        const visibleDocs = docsData.filter((doc: Document) =>
          doc.access === "PUBLIC" || doc.access === "PARTICIPANTS"
        )
        setDocuments(visibleDocs)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitApplication = async () => {
    if (!agreedToRegulation) {
      setError("Необходимо согласиться с регламентом мероприятия")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${eventId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreedToRegulation }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("Заявка успешно подана!")
        setApplication(data)
      } else {
        setError(data.error || "Ошибка подачи заявки")
      }
    } catch (error) {
      setError("Ошибка подачи заявки")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawApplication = async () => {
    if (!confirm("Вы уверены, что хотите отозвать заявку?")) return

    try {
      const response = await fetch(`/api/events/${eventId}/applications`, {
        method: "DELETE",
      })

      if (response.ok) {
        setApplication(null)
        setSuccess("Заявка отозвана")
      }
    } catch (error) {
      setError("Ошибка при отзыве заявки")
    }
  }

  const handleFileUpload = async (moduleCode: string, file: File) => {
    if (!teamInfo) return

    setUploadingModule(moduleCode)
    setError("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("moduleCode", moduleCode)

      const response = await fetch(`/api/teams/${teamInfo.id}/files`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const newFile = await response.json()
        setTeamFiles(prev => [...prev.filter(f => f.moduleCode !== moduleCode), newFile])
        setSuccess(`Файл для модуля ${moduleCode} успешно загружен`)
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка загрузки файла")
      }
    } catch (error) {
      setError("Ошибка загрузки файла")
    } finally {
      setUploadingModule(null)
    }
  }

  const handleDeleteFile = async (fileId: string, moduleCode: string) => {
    if (!teamInfo || !confirm("Удалить загруженный файл?")) return

    try {
      const response = await fetch(`/api/teams/${teamInfo.id}/files?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTeamFiles(prev => prev.filter(f => f.id !== fileId))
        setSuccess(`Файл модуля ${moduleCode} удален`)
      }
    } catch (error) {
      setError("Ошибка удаления файла")
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: "На рассмотрении", className: "bg-yellow-100 text-yellow-700" },
      APPROVED: { label: "Одобрена", className: "bg-green-100 text-green-700" },
      REJECTED: { label: "Отклонена", className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: "Отозвана", className: "bg-gray-100 text-gray-700" },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REGULATION: "Регламент",
      SMP: "Skill Management Plan",
      INFRASTRUCTURE: "Инфраструктурный лист",
      SCHEDULE: "Расписание",
      OTHER: "Документ",
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " Б"
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " КБ"
    return (bytes / (1024 * 1024)).toFixed(1) + " МБ"
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Мероприятие не найдено</p>
        <Link href="/events">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            К списку мероприятий
          </Button>
        </Link>
      </div>
    )
  }

  const isApproved = application?.status === "APPROVED"
  const canUploadFiles = isApproved && ["IN_PROGRESS", "SCORING"].includes(event.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-red-600">{event.competency}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <p className="text-gray-600">{event.description}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  Проведение: {format(new Date(event.eventStart), "d MMMM", { locale: ru })} —{" "}
                  {format(new Date(event.eventEnd), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Регистрация до: {format(new Date(event.registrationEnd), "d MMMM yyyy", { locale: ru })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>
                  Размер команды: {event.minTeamSize === event.maxTeamSize
                    ? `${event.minTeamSize} чел.`
                    : `${event.minTeamSize}–${event.maxTeamSize} чел.`}
                </span>
              </div>
            </div>

            {teamInfo && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  Ваша команда: {teamInfo.name}
                  {teamInfo.number && ` (#${teamInfo.number})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ваша заявка</CardTitle>
          </CardHeader>
          <CardContent>
            {application ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {application.status === "APPROVED" ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : application.status === "REJECTED" ? (
                    <XCircle className="h-5 w-5 text-red-600" />
                  ) : (
                    <Loader2 className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getStatusBadge(application.status).className}`}>
                    {getStatusBadge(application.status).label}
                  </span>
                </div>

                <p className="text-sm text-gray-500">
                  Подана: {format(new Date(application.createdAt), "d MMMM yyyy, HH:mm", { locale: ru })}
                </p>

                {application.comment && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Комментарий организатора:</strong> {application.comment}
                    </p>
                  </div>
                )}

                {application.status === "PENDING" && (
                  <Button variant="outline" onClick={handleWithdrawApplication} className="w-full">
                    Отозвать заявку
                  </Button>
                )}
              </div>
            ) : event.status === "REGISTRATION_OPEN" ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Для участия в мероприятии подайте заявку. После одобрения вы будете добавлены в команду.
                </p>

                <Checkbox
                  name="agreedToRegulation"
                  checked={agreedToRegulation}
                  onChange={(e) => setAgreedToRegulation(e.target.checked)}
                  label="Я ознакомился и согласен с регламентом мероприятия"
                />

                <Button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !agreedToRegulation}
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Подать заявку
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Регистрация на это мероприятие закрыта
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Documents section */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Документы мероприятия
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <File className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {getDocumentTypeLabel(doc.type)} • Версия {doc.version}
                      </p>
                    </div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Скачать
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* File upload section for approved participants */}
      {isApproved && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Загрузка работ по модулям
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Схема оценки для этого мероприятия ещё не настроена.
                Модули для загрузки работ появятся после её добавления.
              </p>
            ) : !canUploadFiles ? (
              <p className="text-gray-500 text-center py-4">
                Загрузка файлов доступна только во время проведения мероприятия
                (статус «В процессе» или «Оценивание»)
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Загрузите итоговые файлы по каждому модулю для оценки экспертами.
                </p>
                <div className="space-y-3">
                  {modules.map((module) => {
                    const existingFile = teamFiles.find(f => f.moduleCode === module.code)
                    const isUploading = uploadingModule === module.code

                    return (
                      <div
                        key={module.id}
                        className="p-4 border rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              Модуль {module.code}: {module.name}
                            </p>
                            {existingFile && (
                              <p className="text-sm text-green-600 mt-1">
                                Загружен: {existingFile.fileName} ({formatFileSize(existingFile.fileSize)})
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {existingFile && (
                              <>
                                <a href={existingFile.fileUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </a>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteFile(existingFile.id, module.code)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </>
                            )}
                            <input
                              type="file"
                              ref={(el) => { fileInputRefs.current[module.code] = el }}
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleFileUpload(module.code, file)
                              }}
                            />
                            <Button
                              variant={existingFile ? "outline" : "default"}
                              size="sm"
                              onClick={() => fileInputRefs.current[module.code]?.click()}
                              disabled={isUploading}
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Upload className="h-4 w-4 mr-2" />
                                  {existingFile ? "Заменить" : "Загрузить"}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
