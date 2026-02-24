"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, Users, Award, ClipboardList, ArrowRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"

interface DashboardStats {
  eventsCount: number
  participantsCount: number
  teamsCount: number
  passportsCount: number
}

interface Application {
  id: string
  status: string
  createdAt: string
  event: {
    id: string
    name: string
    competency: string
  }
}

interface Passport {
  id: string
  totalScore: number
  event: {
    id: string
    name: string
    competency: string
  }
  team: {
    rank: number
  } | null
}

interface Event {
  id: string
  name: string
  competency: string
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

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [passports, setPassports] = useState<Passport[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [session])

  const fetchData = async () => {
    try {
      // Fetch events for everyone
      const eventsRes = await fetch("/api/events")
      if (eventsRes.ok) {
        const eventsData = await eventsRes.json()
        setEvents(eventsData.slice(0, 5))

        if (isAdmin) {
          // Calculate stats for admin
          const usersRes = await fetch("/api/users")
          const usersData = usersRes.ok ? await usersRes.json() : []

          let teamsCount = 0
          let passportsCount = 0
          for (const event of eventsData) {
            teamsCount += event._count?.teams || 0
          }

          // Get passports count from users
          for (const user of usersData) {
            passportsCount += user._count?.skillPassports || 0
          }

          setStats({
            eventsCount: eventsData.length,
            participantsCount: usersData.length,
            teamsCount,
            passportsCount,
          })
        }
      }

      // Fetch user's applications and passports (for participants)
      if (!isAdmin && !isExpert) {
        const appsRes = await fetch("/api/events")
        if (appsRes.ok) {
          const eventsData = await appsRes.json()
          // Filter events where user has applied
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
                  competency: event.competency,
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
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.PENDING}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin && t.dashboard.adminSubtitle}
          {isExpert && t.dashboard.expertSubtitle}
          {!isAdmin && !isExpert && t.dashboard.participantSubtitle}
        </p>
      </div>


      {!isAdmin && !isExpert && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{app.event.name}</p>
                          <p className="text-sm text-gray-500">{app.event.competency}</p>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t.dashboard.noActiveApplications}</p>
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
                      className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{passport.event.name}</p>
                          <p className="text-sm text-gray-500">{passport.event.competency}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">{passport.totalScore.toFixed(1)}</p>
                          {passport.team?.rank && (
                            <p className="text-xs text-gray-500">{passport.team.rank} {t.passports.place}</p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">{t.dashboard.resultsWillAppear}</p>
              )}
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
            <p className="text-gray-500 text-sm">{t.dashboard.noAssignedTeams}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t.dashboard.upcomingEvents}</CardTitle>
          <Link href="/events" className="text-sm text-red-600 hover:underline flex items-center gap-1">
            {t.common.all} <ArrowRight className="h-4 w-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.filter(e => e.status !== "ARCHIVED").slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{event.name}</p>
                      <p className="text-sm text-gray-500">{event.competency}</p>
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
            <p className="text-gray-500 text-sm">{t.dashboard.noPlannedEvents}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
