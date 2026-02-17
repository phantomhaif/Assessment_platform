"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Upload, Users, Play, CheckCircle, Trophy } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"

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
  members: TeamMember[]
}

interface Event {
  id: string
  name: string
  description: string | null
  competency: string
  status: string
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
  maxTeamSize: number
  minTeamSize: number
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
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
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
    try {
      const response = await fetch(`/api/events/${eventId}/publish-results`, {
        method: "POST",
      })
      if (response.ok) {
        alert(t.adminEvent.resultsPublishedAlert)
        fetchEvent()
      }
    } catch (error) {
      console.error("Error publishing results:", error)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
            <p className="text-gray-500">{event.competency}</p>
          </div>
        </div>
        <div className="flex gap-2">
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
                <Button onClick={publishResults} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t.adminEvent.publishResults}
                </Button>
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
              <div className="flex justify-between">
                <span className="text-gray-500">{t.adminEvent.teamsCount}</span>
                <span className="font-bold">{event._count.teams}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.adminEvent.applicationsCount}</span>
                <span className="font-bold">{event._count.applications}</span>
              </div>
              <div className="flex justify-between">
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
          </CardContent>
        </Card>
      </div>

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
