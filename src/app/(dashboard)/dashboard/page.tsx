"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [passports, setPassports] = useState<Passport[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const getEventName = (event: { name: string; nameEn?: string | null }) =>
    locale === "en" ? event.nameEn || event.name : event.name

  const getCompetencyName = (event: { competency: string; competencyEn?: string | null }) =>
    locale === "en" ? event.competencyEn || event.competency : event.competency

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
                      className="block p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{getEventName(passport.event)}</p>
                          <p className="text-sm text-gray-500">{getCompetencyName(passport.event)}</p>
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
            <p className="text-gray-500 text-sm">{t.dashboard.noAssignedTeams}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <p className="text-gray-500 text-sm">{t.dashboard.noPlannedEvents}</p>
          )}
        </CardContent>
      </Card>

      {/* Footer with IITB Contacts */}
      <footer className="mt-12 py-8 border-t border-gray-200 bg-gray-50 rounded-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
            {/* About Platform */}
            <div>
              <h3 className="font-bold text-gray-900 mb-3">INDUSTRY SKILLS</h3>
              <p className="text-gray-600 text-sm">
                {locale === "ru"
                  ? "INDUSTRY SKILLS - Платформа оценки знаний в ходе соревнований профессионального мастерства"
                  : "KA - knowledge assessment"}
              </p>
            </div>

            {/* IITB Contacts */}
            <div>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-700">
                      {locale === "ru" ? "197046, Россия" : "197046, Russia"}
                    </p>
                    <p>
                      {locale === "ru"
                        ? "Санкт-Петербург, Петроградская набережная, д. 36A"
                        : "St. Petersburg, Petrogradskaya Embankment, 36A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <a href="tel:+78126440126" className="hover:text-[#C41E3A] transition-colors">
                    +7 (812) 644-01-26
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <a href="tel:+79812015823" className="hover:text-[#C41E3A] transition-colors">
                    +7 (981) 201-58-23
                  </a>
                </div>

                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-[#C41E3A] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:industryskills@iitb.ru" className="hover:text-[#C41E3A] transition-colors">
                    industryskills@iitb.ru
                  </a>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">
                    {locale === "ru" ? "Марина Гладкова" : "Marina Gladkova"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru"
                      ? "Менеджер по организации соревнований профессионального мастерства Industry Skills"
                      : "Manager for organizing Industry Skills professional mastery competitions"}
                  </p>
                  <div className="mt-3 space-y-2">
                    <a href="mailto:gladkova.m@iitb.ru" className="block hover:text-[#C41E3A] transition-colors">
                      gladkova.m@iitb.ru
                    </a>
                    <a href="tel:+79111954745" className="block hover:text-[#C41E3A] transition-colors">
                      +7 (911) 195-47-45
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white/70 p-4">
                  <p className="font-semibold text-gray-800">
                    {locale === "ru" ? "Тимур Белышев" : "Timur Belyshev"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru"
                      ? "Технический эксперт"
                      : "Technical Expert"}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    {locale === "ru"
                      ? "Инженер тренингового центра компетенций профессионального мастерства Industry Skills"
                      : "Engineer at the Industry Skills professional mastery competency training center"}
                  </p>
                  <div className="mt-3 space-y-2">
                    <a href="mailto:belyshev.t@iitb.ru" className="block hover:text-[#C41E3A] transition-colors">
                      belyshev.t@iitb.ru
                    </a>
                    <a href="tel:+78126440126" className="block hover:text-[#C41E3A] transition-colors">
                      +7 (812) 644-01-26
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* IITB Logo */}
            <div className="flex items-center justify-center md:justify-end">
              <Image
                src={locale === "ru" ? "/iitb-logo-ru.png" : "/iitb-logo-en.png"}
                alt="ИИТБ"
                width={200}
                height={60}
                className="object-contain"
              />
            </div>
          </div>

          <div className="border-t border-gray-300 pt-4 text-center text-gray-500 text-sm">
            <p>© 2026 INDUSTRY SKILLS. {locale === "ru" ? "Все права защищены." : "All rights reserved."}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
