"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { ContactsSection } from "@/components/layout/contacts-section"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"

interface Application {
  id: string
  status: string
  createdAt: string
  event: {
    id: string
    name: string
    nameEn?: string | null
    competency: string
    competencyEn?: string | null
  }
}

interface Passport {
  id: string
  totalScore: number
  event: {
    id: string
    name: string
    nameEn?: string | null
    competency: string
    competencyEn?: string | null
  }
  team: {
    rank: number
  } | null
}

interface Event {
  id: string
  name: string
  nameEn?: string | null
  competency: string
  competencyEn?: string | null
  status: string
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"
  const isExpert = session?.user?.role === "EXPERT"

  const [applications, setApplications] = useState<Application[]>([])
  const [passports, setPassports] = useState<Passport[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getEventName = (event: { name: string; nameEn?: string | null }) =>
    locale === "en" ? event.nameEn || event.name : event.name

  const getCompetencyName = (event: { competency: string; competencyEn?: string | null }) =>
    locale === "en" ? event.competencyEn || event.competency : event.competency

  useEffect(() => {
    const fetchData = async () => {
      try {
        const eventsRes = await fetch("/api/events")
        if (eventsRes.ok) {
          const eventsData = await eventsRes.json()
          setEvents(eventsData.slice(0, 5))
        }

        if (!isAdmin && !isExpert) {
          const appsRes = await fetch("/api/events")
          if (appsRes.ok) {
            const eventsData = await appsRes.json()
            const userApps: Application[] = []

            for (const event of eventsData) {
              if (event.userApplication) {
                userApps.push({
                  id: event.userApplication.id,
                  status: event.userApplication.status,
                  createdAt: event.userApplication.createdAt,
                  event: {
                    id: event.id,
                    name: event.name,
                    nameEn: event.nameEn,
                    competency: event.competency,
                    competencyEn: event.competencyEn,
                  },
                })
              }
            }

            setApplications(userApps)
          }

          const passportsRes = await fetch("/api/my-passports")
          if (passportsRes.ok) {
            const passportsData = await passportsRes.json()
            setPassports(passportsData)
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [isAdmin, isExpert])

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
      WITHDRAWN: "bg-gray-100 text-gray-700",
    }
    const labels: Record<string, string> = {
      PENDING: t.applications.pending,
      APPROVED: t.applications.approved,
      REJECTED: t.applications.rejected,
      WITHDRAWN: t.applications.withdrawn,
    }

    return (
      <span className={`rounded-full px-2 py-1 text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="mt-1 text-gray-500">
          {isAdmin && t.dashboard.adminSubtitle}
          {isExpert && t.dashboard.expertSubtitle}
          {!isAdmin && !isExpert && t.dashboard.participantSubtitle}
        </p>
      </div>

      {!isAdmin && !isExpert && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.myApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              {applications.length > 0 ? (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <Link
                      key={app.id}
                      href={`/events/${app.event.id}`}
                      className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-red-300 hover:bg-red-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{getEventName(app.event)}</p>
                          <p className="text-sm text-gray-500">{getCompetencyName(app.event)}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t.dashboard.noActiveApplications}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.myResults}</CardTitle>
            </CardHeader>
            <CardContent>
              {passports.length > 0 ? (
                <div className="space-y-3">
                  {passports.map((passport) => (
                    <Link
                      key={passport.id}
                      href="/my-passports"
                      className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-red-300 hover:bg-red-50"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{getEventName(passport.event)}</p>
                          <p className="text-sm text-gray-500">{getCompetencyName(passport.event)}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{passport.totalScore.toFixed(1)}</p>
                          {passport.team?.rank && (
                            <p className="text-xs text-gray-500">
                              {passport.team.rank} {t.passports.place}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">{t.dashboard.resultsWillAppear}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.nav.documents}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                {locale === "ru"
                  ? "Регламенты, расписания и другие материалы по мероприятиям, в которых вы зарегистрированы."
                  : "Regulations, schedules, and other materials for events you are registered for."}
              </p>
              <Link href="/documents">
                <Button className="w-full" variant="outline">
                  {locale === "ru" ? "Открыть документы" : "Open Documents"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {isExpert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.dashboard.assignedScores}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">{t.dashboard.noAssignedTeams}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg">{t.dashboard.upcomingEvents}</CardTitle>
          <Link href="/events" className="flex items-center gap-1 text-sm text-red-600 hover:underline">
            {t.common.all} <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events
                .filter((event) => event.status !== "ARCHIVED")
                .slice(0, 3)
                .map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-red-300 hover:bg-red-50"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{getEventName(event)}</p>
                        <p className="text-sm text-gray-500">{getCompetencyName(event)}</p>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <p>{format(new Date(event.eventStart), "d MMM", { locale: dateLocale })}</p>
                        <p>{format(new Date(event.eventEnd), "d MMM yyyy", { locale: dateLocale })}</p>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">{t.dashboard.noPlannedEvents}</p>
          )}
        </CardContent>
      </Card>

      <div className="mt-12">
        <ContactsSection locale={locale} />
      </div>
    </div>
  )
}
