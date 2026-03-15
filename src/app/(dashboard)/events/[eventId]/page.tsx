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
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"

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
  requestedRole: "PARTICIPANT" | "EXPERT"
  approvedRole: "PARTICIPANT" | "EXPERT" | null
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
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
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
  const [requestedRole, setRequestedRole] = useState<"PARTICIPANT" | "EXPERT">("PARTICIPANT")
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
      setError(t.events.mustAgreeToRegulation)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const response = await fetch(`/api/events/${eventId}/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreedToRegulation, requestedRole }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.events.applicationSuccess)
        setApplication(data)
      } else {
        setError(data.error || t.events.applicationError)
      }
    } catch (error) {
      setError(t.events.applicationError)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWithdrawApplication = async () => {
    if (!confirm(t.events.confirmWithdraw)) return

    try {
      const response = await fetch(`/api/events/${eventId}/applications`, {
        method: "DELETE",
      })

      if (response.ok) {
        setApplication(null)
        setSuccess(t.events.applicationWithdrawn)
      }
    } catch (error) {
      setError(t.events.withdrawError)
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
        setSuccess(t.events.fileUploadSuccess.replace("{code}", moduleCode))
      } else {
        const data = await response.json()
        setError(data.error || t.events.fileUploadError)
      }
    } catch (error) {
      setError(t.events.fileUploadError)
    } finally {
      setUploadingModule(null)
    }
  }

  const handleDeleteFile = async (fileId: string, moduleCode: string) => {
    if (!teamInfo || !confirm(t.events.fileDeleteConfirm)) return

    try {
      const response = await fetch(`/api/teams/${teamInfo.id}/files?fileId=${fileId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTeamFiles(prev => prev.filter(f => f.id !== fileId))
        setSuccess(t.events.fileDeleted.replace("{code}", moduleCode))
      }
    } catch (error) {
      setError(t.events.fileDeleteError)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      PENDING: { label: t.applications.pending, className: "bg-yellow-100 text-yellow-700" },
      APPROVED: { label: t.applications.approved, className: "bg-green-100 text-green-700" },
      REJECTED: { label: t.applications.rejected, className: "bg-red-100 text-red-700" },
      WITHDRAWN: { label: t.applications.withdrawn, className: "bg-gray-100 text-gray-700" },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  }

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      REGULATION: t.documents.types.regulation,
      SMP: t.documents.types.smp,
      INFRASTRUCTURE: t.documents.types.infrastructure,
      SCHEDULE: t.documents.types.schedule,
      OTHER: t.documents.types.other,
    }
    return labels[type] || type
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + (locale === "ru" ? " Б" : " B")
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + (locale === "ru" ? " КБ" : " KB")
    return (bytes / (1024 * 1024)).toFixed(1) + (locale === "ru" ? " МБ" : " MB")
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
        <p className="text-gray-500">{t.events.eventNotFound}</p>
        <Link href="/events">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t.events.backToEvents}
          </Button>
        </Link>
      </div>
    )
  }

  const isApproved = application?.status === "APPROVED"
  const canUploadFiles = isApproved && ["IN_PROGRESS", "SCORING"].includes(event.status)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
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
            <CardTitle className="text-lg">{t.events.information}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.description && (
              <p className="text-gray-600">{event.description}</p>
            )}
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  {t.events.eventDates}: {format(new Date(event.eventStart), "d MMMM", { locale: dateLocale })} —{" "}
                  {format(new Date(event.eventEnd), "d MMMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {t.events.registrationUntil}: {format(new Date(event.registrationEnd), "d MMMM yyyy", { locale: dateLocale })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>
                  {t.events.teamSizeLabel}: {event.minTeamSize === event.maxTeamSize
                    ? `${event.minTeamSize} ${t.events.persons}`
                    : `${event.minTeamSize}–${event.maxTeamSize} ${t.events.persons}`}
                </span>
              </div>
            </div>

            {teamInfo && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium text-red-900">
                  {t.events.yourTeam}: {teamInfo.name}
                  {teamInfo.number && ` (#${teamInfo.number})`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.events.yourApplication}</CardTitle>
          </CardHeader>
          <CardContent>
            {application ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
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

                {application.createdAt && (
                  <p className="text-sm text-gray-500">
                    {t.events.submitted}: {format(new Date(application.createdAt), "d MMMM yyyy, HH:mm", { locale: dateLocale })}
                  </p>
                )}

                <p className="text-sm text-gray-500">
                  {locale === "ru" ? "Роль" : "Role"}:{" "}
                  {application.approvedRole === "EXPERT" || application.requestedRole === "EXPERT"
                    ? t.roles.expert
                    : t.roles.participant}
                </p>

                {application.comment && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>{t.events.organizerComment}:</strong> {application.comment}
                    </p>
                  </div>
                )}

                {application.status === "PENDING" && (
                  <Button variant="outline" onClick={handleWithdrawApplication} className="w-full">
                    {t.events.withdrawApplication}
                  </Button>
                )}
              </div>
            ) : event.status === "REGISTRATION_OPEN" ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t.events.applyDescription}
                </p>

                {/* Уведомление об отмене заявки */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-amber-900 mb-2">
                    {locale === "ru" ? "⚠️ Важная информация:" : "⚠️ Important Information:"}
                  </p>
                  <div className="text-sm text-amber-800 space-y-2">
                    <p>
                      {locale === "ru"
                        ? "Университеты и колледжи, заявившие своих студентов в качестве участников соревнований, в случае отзыва заявки в течение месяца до начала соревнований и в период их проведения – дисквалифицируются на участие в соревнованиях сроком на 1 год. Бан распространяется на ту компетенцию, в которой заявились участники, и все соревнования, проводимые организаторами."
                        : "Universities and colleges that have registered their students as competition participants, in case of withdrawal within one month before the start of the competition and during the competition period, will be disqualified from participation for 1 year. The ban applies to the competency in which participants were registered and all competitions conducted by the organizers."}
                    </p>
                    <p>
                      {locale === "ru"
                        ? "Корпоративным командам, заявившим своих сотрудников в качестве участников соревнований, в случае отзыва заявки в течение месяца до начала соревнований и в период их проведения – регистрационный взнос не возмещается."
                        : "For corporate teams that have registered their employees as competition participants, in case of withdrawal within one month before the start of the competition and during the competition period, the registration fee is non-refundable."}
                    </p>
                    <p className="font-medium">
                      {locale === "ru"
                        ? "Замена участников в команде не считается снятием заявки и не попадает под действие пунктов выше."
                        : "Replacing team members is not considered withdrawal and is not subject to the above provisions."}
                    </p>
                  </div>
                </div>

                <Checkbox
                  name="agreedToRegulation"
                  checked={agreedToRegulation}
                  onChange={(e) => setAgreedToRegulation(e.target.checked)}
                  label={t.events.agreeToRegulation}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    {locale === "ru" ? "Роль в мероприятии" : "Role in the event"}
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setRequestedRole("PARTICIPANT")}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                        requestedRole === "PARTICIPANT"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {t.roles.participant}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRequestedRole("EXPERT")}
                      className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                        requestedRole === "EXPERT"
                          ? "border-red-500 bg-red-50 text-red-700"
                          : "border-gray-300 bg-white text-gray-700"
                      }`}
                    >
                      {t.roles.expert}
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting || !agreedToRegulation}
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  {t.events.apply}
                </Button>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t.events.registrationClosed}
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
              {t.events.eventDocuments}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <File className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">
                        {getDocumentTypeLabel(doc.type)} • {t.events.version} {doc.version}
                      </p>
                    </div>
                  </div>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      {t.common.download}
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
              {t.events.moduleUpload}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                {t.events.schemaNotConfigured}
              </p>
            ) : !canUploadFiles ? (
              <p className="text-gray-500 text-center py-4">
                {t.events.uploadDuringEvent}
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t.events.uploadInstructions}
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
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {t.events.module} {module.code}: {module.name}
                            </p>
                            {existingFile && (
                              <p className="text-sm text-green-600 mt-1">
                                {t.events.uploaded}: {existingFile.fileName} ({formatFileSize(existingFile.fileSize)})
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
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
                                  {existingFile ? t.events.replace : t.common.upload}
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
