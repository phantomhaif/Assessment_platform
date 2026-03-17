"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Upload, Users, Play, CheckCircle, Trophy, Download, Mail, FolderOpen, FileText } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"
import { getLocalizedCompetency, getLocalizedDescription, getLocalizedEventName } from "@/lib/events"

interface TeamMember {
  user: {
    firstName: string
    lastName: string
  }
}

interface RankedTeam {
  id: string
  name: string
  rank: number
  totalScore: number
  number?: number | null
  members: TeamMember[]
}

interface Event {
  id: string
  name: string
  nameEn?: string | null
  description: string | null
  descriptionEn?: string | null
  competency: string
  competencyEn?: string | null
  status: string
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
  maxTeamSize: number
  minTeamSize: number
  passportPreparationStatus?: string | null
  passportPreparationTotal?: number
  passportPreparationCompleted?: number
  passportPreparationError?: string | null
  passportPreparationStartedAt?: string | null
  passportPreparationFinishedAt?: string | null
  _count: {
    teams: number
    applications: number
  }
  assessmentSchema: { id: string; name: string } | null
  teams: RankedTeam[]
}

const getMedalEmoji = (rank: number) => {
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return null
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [previewTeams, setPreviewTeams] = useState<RankedTeam[]>([])
  const [publishPassports, setPublishPassports] = useState(true)
  const [isPreparingSamplePassport, setIsPreparingSamplePassport] = useState(false)
  const [isGeneratingAllPassports, setIsGeneratingAllPassports] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  useEffect(() => {
    if (event?.status !== "SCORING" || event.passportPreparationStatus !== "RUNNING") {
      return
    }

    const intervalId = window.setInterval(() => {
      void fetchEvent()
    }, 5000)

    return () => window.clearInterval(intervalId)
  }, [event?.status, event?.passportPreparationStatus])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
        if (data.status === "SCORING") {
          fetchPreview()
        } else {
          setPreviewTeams([])
        }
      }
    } catch (error) {
      console.error("Error fetching event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (newStatus: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        fetchEvent()
      }
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const publishResults = async () => {
    const passportsReady =
      !publishPassports ||
      (event?.passportPreparationStatus === "COMPLETED" &&
        (event.passportPreparationTotal || 0) > 0 &&
        (event.passportPreparationCompleted || 0) >= (event.passportPreparationTotal || 0))

    if (!passportsReady) {
      alert(
        locale === "ru"
          ? "Сначала завершите подготовку всех паспортов, а затем публикуйте результаты."
          : "Finish preparing all passports before publishing results."
      )
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}/publish-results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishPassports }),
      })
      if (response.ok) {
        alert(
          publishPassports
            ? t.adminEvent.resultsPublishedAlert
            : locale === "ru"
              ? "Результаты опубликованы. Паспорта сохранены как черновики."
              : "Results published. Passports remain unpublished."
        )
        fetchEvent()
      }
    } catch (error) {
      console.error("Error publishing results:", error)
    }
  }

  const fetchPreview = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/publish-results`)
      if (response.ok) {
        const data = await response.json()
        setPreviewTeams(data.teams || [])
      }
    } catch (error) {
      console.error("Error fetching results preview:", error)
    }
  }

  const prepareSamplePassport = async () => {
    setIsPreparingSamplePassport(true)
    try {
      const response = await fetch(`/api/events/${eventId}/prepare-passports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "sample" }),
      })

      if (response.ok) {
        alert(
          locale === "ru"
            ? "Тестовый паспорт подготовлен в русском и английском вариантах. Проверьте его в разделе «Паспорта»."
            : "The sample passport is ready in both languages. Review it in Passports."
        )
      }
    } catch (error) {
      console.error("Error preparing sample passport:", error)
    } finally {
      setIsPreparingSamplePassport(false)
    }
  }

  const generateAllPassports = async () => {
    setIsGeneratingAllPassports(true)
    try {
      const response = await fetch(`/api/events/${eventId}/prepare-passports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "all" }),
      })
      const payload = response.ok ? await response.json().catch(() => null) : null

      if (response.ok) {
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                passportPreparationStatus: "RUNNING",
                passportPreparationTotal: typeof payload?.total === "number" ? payload.total : prev.passportPreparationTotal,
                passportPreparationCompleted: 0,
                passportPreparationError: null,
              }
            : prev
        )
        alert(
          locale === "ru"
            ? "Паспорта для всех участников подготовлены последовательно и сохранены как черновики."
            : "Passports for all participants were generated sequentially and saved as drafts."
        )
      }
    } catch (error) {
      console.error("Error generating all passports:", error)
    } finally {
      setIsGeneratingAllPassports(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!event) {
    return <div>{t.events.eventNotFound}</div>
  }

  const statusLabels: Record<string, string> = {
    DRAFT: t.events.status.draft,
    REGISTRATION_OPEN: t.events.status.registration_open,
    REGISTRATION_CLOSED: t.events.status.registration_closed,
    IN_PROGRESS: t.events.status.in_progress,
    SCORING: t.events.status.scoring,
    RESULTS_PUBLISHED: t.events.status.results_published,
  }

  const eventName = getLocalizedEventName(event, locale)
  const eventCompetency = getLocalizedCompetency(event, locale)
  const eventDescription = getLocalizedDescription(event, locale)
  const preparationTotal = event.passportPreparationTotal || 0
  const preparationCompleted = event.passportPreparationCompleted || 0
  const preparationPercent =
    preparationTotal > 0 ? Math.min(100, Math.round((preparationCompleted / preparationTotal) * 100)) : 0
  const passportsReadyForPublish =
    event.passportPreparationStatus === "COMPLETED" &&
    preparationTotal > 0 &&
    preparationCompleted >= preparationTotal

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{eventName}</h1>
            <p className="text-gray-500">{eventCompetency}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link href={`/admin/events/${eventId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t.common.edit}
            </Button>
          </Link>
          <Link href={`/admin/events/${eventId}/schema`}>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              {t.adminEvent.assessmentSchema}
            </Button>
          </Link>
          <Link href={`/admin/events/${eventId}/send-email`}>
            <Button variant="outline">
              <Mail className="h-4 w-4 mr-2" />
              {t.adminEvent.sendEmail}
            </Button>
          </Link>
          <Link href={`/admin/submissions?eventId=${eventId}`}>
            <Button variant="outline">
              <FolderOpen className="h-4 w-4 mr-2" />
              {locale === "ru" ? "Работы команд" : "Team Submissions"}
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.adminEvent.statusLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600 mb-4">
              {statusLabels[event.status] || event.status}
            </p>
            <div className="space-y-2">
              {event.status === "DRAFT" && (
                <Button onClick={() => updateStatus("REGISTRATION_OPEN")} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  {t.adminEvent.openRegistration}
                </Button>
              )}
              {event.status === "REGISTRATION_OPEN" && (
                <Button onClick={() => updateStatus("REGISTRATION_CLOSED")} className="w-full">
                  {t.adminEvent.closeRegistration}
                </Button>
              )}
              {event.status === "REGISTRATION_CLOSED" && (
                <Button onClick={() => updateStatus("IN_PROGRESS")} className="w-full">
                  {t.adminEvent.startEvent}
                </Button>
              )}
              {event.status === "IN_PROGRESS" && (
                <Button onClick={() => updateStatus("SCORING")} className="w-full">
                  {t.adminEvent.startScoring}
                </Button>
              )}
              {event.status === "SCORING" && (
                <div className="space-y-3">
                  <label className="flex items-start gap-2 rounded-lg border border-gray-200 p-3 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={publishPassports}
                      onChange={(e) => setPublishPassports(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      {locale === "ru"
                        ? "Публиковать skill passports вместе с результатами"
                        : "Publish skill passports together with results"}
                    </span>
                  </label>
                  <Button onClick={publishResults} className="w-full" disabled={publishPassports && !passportsReadyForPublish}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {t.adminEvent.publishResults}
                  </Button>
                  {publishPassports && !passportsReadyForPublish && (
                    <p className="text-xs text-amber-700">
                      {locale === "ru"
                        ? "Для публикации вместе с паспортами сначала завершите их подготовку."
                        : "Complete passport preparation before publishing them together with results."}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.eventForm.dates}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">{t.adminEvent.registration}</span>
              <p className="font-medium">
                {format(new Date(event.registrationStart), "d MMM", { locale: dateLocale })} —{" "}
                {format(new Date(event.registrationEnd), "d MMM yyyy", { locale: dateLocale })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">{t.adminEvent.event}</span>
              <p className="font-medium">
                {format(new Date(event.eventStart), "d MMM", { locale: dateLocale })} —{" "}
                {format(new Date(event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.adminEvent.participantsCard}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">{t.adminEvent.teamsCount}</span>
                <span className="font-bold">{event._count.teams}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">{t.adminEvent.applicationsCount}</span>
                <span className="font-bold">{event._count.applications}</span>
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-gray-500">{t.adminEvent.teamSize}</span>
                <span className="font-medium">{event.minTeamSize}-{event.maxTeamSize}</span>
              </div>
            </div>
            <Link href={`/admin/events/${eventId}/teams`}>
              <Button variant="outline" className="w-full mt-4">
                <Users className="h-4 w-4 mr-2" />
                {t.adminEvent.manageTeams}
              </Button>
            </Link>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <a href={`/api/events/${eventId}/participants/export`} className="flex-1">
                <Button variant="outline" className="w-full" title="CSV">
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </Button>
              </a>
              <a href={`/api/events/${eventId}/participants/export-excel`} className="flex-1">
                <Button variant="outline" className="w-full" title="Excel">
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {eventDescription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.common.description}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-gray-700">{eventDescription}</p>
          </CardContent>
        </Card>
      )}

      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.common.description}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{event.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.adminEvent.assessmentSchema}</CardTitle>
        </CardHeader>
        <CardContent>
          {event.assessmentSchema ? (
            <div>
              <p className="text-green-600 font-medium">{t.adminEvent.schemaLoaded} {event.assessmentSchema.name}</p>
              <Link href={`/admin/events/${eventId}/schema`}>
                <Button variant="outline" className="mt-2">
                  {t.adminEvent.changeSchema}
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-2">{t.adminEvent.schemaNotLoaded}</p>
              <Link href={`/admin/events/${eventId}/schema`}>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  {t.adminEvent.uploadExcel}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {event.status === "SCORING" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">
              {locale === "ru" ? "Предпросмотр результатов" : "Results preview"}
            </CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={prepareSamplePassport} disabled={isPreparingSamplePassport || isGeneratingAllPassports}>
                <FileText className="h-4 w-4 mr-2" />
                {locale === "ru" ? "Подготовить тестовый паспорт" : "Prepare sample passport"}
              </Button>
              <Button variant="outline" onClick={generateAllPassports} disabled={isPreparingSamplePassport || isGeneratingAllPassports}>
                <Download className="h-4 w-4 mr-2" />
                {locale === "ru" ? "Сгенерировать все паспорта" : "Generate all passports"}
              </Button>
              <Link href={`/admin/passports?eventId=${eventId}`}>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  {locale === "ru" ? "Проверить паспорта" : "Review passports"}
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-500">
              {locale === "ru"
                ? "Сначала проверьте один тестовый паспорт на двух языках, затем отдельно запустите генерацию для всех участников. Публикация результатов больше не ждёт генерацию PDF."
                : "First review one sample passport in both languages, then run generation for all participants separately. Publishing results no longer waits for PDF generation."}
            </p>
            {event.passportPreparationStatus && (
              <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {locale === "ru" ? "Подготовка паспортов" : "Passport preparation"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {event.passportPreparationStatus === "RUNNING"
                        ? locale === "ru"
                          ? "Фоновая генерация идет последовательно по одному паспорту."
                          : "Background generation is running sequentially one passport at a time."
                        : event.passportPreparationStatus === "COMPLETED"
                          ? locale === "ru"
                            ? "Все паспорта подготовлены."
                            : "All passports are prepared."
                          : locale === "ru"
                            ? "Подготовка завершилась с ошибкой."
                            : "Preparation finished with an error."}
                    </p>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    {preparationCompleted}/{preparationTotal}
                  </div>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-[#C41E3A] transition-all"
                    style={{ width: `${preparationPercent}%` }}
                  />
                </div>
                {event.passportPreparationError && (
                  <p className="mt-3 text-sm text-red-600">{event.passportPreparationError}</p>
                )}
              </div>
            )}
            {previewTeams.length === 0 ? (
              <p className="text-sm text-gray-500">
                {locale === "ru" ? "Добавьте оценки, чтобы увидеть предварительный рейтинг." : "Add scores to see the preview ranking."}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        {locale === "ru" ? "Место" : "Rank"}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        {t.teams.title}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                        {locale === "ru" ? "Участники" : "Members"}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                        {t.adminEvent.scoreColumn}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewTeams.map((team) => (
                      <tr key={team.id} className="border-b border-gray-100">
                        <td className="px-4 py-3">{team.rank}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{team.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {team.members.map((member, index) => (
                            <span key={`${member.user.lastName}-${index}`}>
                              {member.user.lastName} {member.user.firstName.charAt(0)}.
                              {index < team.members.length - 1 && ", "}
                            </span>
                          ))}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-600">{team.totalScore.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Rankings Table - only shown after results are published */}
      {event.status === "RESULTS_PUBLISHED" && event.teams && event.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              {t.adminEvent.teamRankings}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">{t.adminEvent.placeColumn}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">{t.teams.title}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600">{t.adminEvent.membersColumn}</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-600">{t.adminEvent.scoreColumn}</th>
                  </tr>
                </thead>
                <tbody>
                  {event.teams.map((team) => (
                    <tr
                      key={team.id}
                      className={`border-b border-gray-100 ${
                        team.rank <= 3 ? "bg-amber-50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getMedalEmoji(team.rank) ? (
                            <span className="text-2xl">{getMedalEmoji(team.rank)}</span>
                          ) : (
                            <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                              {team.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{team.name}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-gray-600">
                          {team.members.map((m, idx) => (
                            <span key={idx}>
                              {m.user.lastName} {m.user.firstName.charAt(0)}.
                              {idx < team.members.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="font-bold text-lg text-red-600">
                          {team.totalScore.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
