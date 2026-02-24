"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Calendar, MapPin, Users, Clock, Filter } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"

interface Event {
  id: string
  name: string
  description: string | null
  competency: string
  logo: string | null
  registrationStart: string
  registrationEnd: string
  eventStart: string
  eventEnd: string
  status: string
  _count: {
    teams: number
    applications: number
  }
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCompetency, setSelectedCompetency] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("date-desc")
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusLabels = t.events.status as Record<string, string>
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: statusLabels.draft, className: "bg-gray-100 text-gray-700" },
      REGISTRATION_OPEN: { label: statusLabels.registration_open, className: "bg-green-100 text-green-700" },
      REGISTRATION_CLOSED: { label: statusLabels.registration_closed, className: "bg-yellow-100 text-yellow-700" },
      IN_PROGRESS: { label: statusLabels.in_progress, className: "bg-red-100 text-red-700" },
      SCORING: { label: statusLabels.scoring, className: "bg-purple-100 text-purple-700" },
      RESULTS_PUBLISHED: { label: statusLabels.results_published, className: "bg-green-100 text-green-700" },
      ARCHIVED: { label: statusLabels.archived, className: "bg-gray-100 text-gray-500" },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  }

  // Get unique competencies for filter
  const competencies = Array.from(new Set(events.map(e => e.competency)))

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      const matchesCompetency = selectedCompetency === "ALL" || event.competency === selectedCompetency
      const matchesStartDate = !startDate || new Date(event.eventStart) >= new Date(startDate)
      const matchesEndDate = !endDate || new Date(event.eventEnd) <= new Date(endDate)
      return matchesCompetency && matchesStartDate && matchesEndDate
    })
    .sort((a, b) => {
      if (sortBy === "date-asc") {
        return new Date(a.eventStart).getTime() - new Date(b.eventStart).getTime()
      } else if (sortBy === "date-desc") {
        return new Date(b.eventStart).getTime() - new Date(a.eventStart).getTime()
      }
      return 0
    })

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
        <h1 className="text-2xl font-bold text-gray-900">{t.events.title}</h1>
        <p className="text-gray-500 mt-1">
          {locale === "ru" ? "Доступные соревнования и чемпионаты" : "Available competitions and championships"}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{t.common.filter}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.events.competency}
              </label>
              <select
                value={selectedCompetency}
                onChange={(e) => setSelectedCompetency(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="ALL">{t.common.all}</option>
                {competencies.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === "ru" ? "Дата начала" : "Start date"}
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === "ru" ? "Дата окончания" : "End date"}
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === "ru" ? "Сортировка" : "Sort by"}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="date-desc">{locale === "ru" ? "Сначала новые" : "Newest first"}</option>
                <option value="date-asc">{locale === "ru" ? "Сначала старые" : "Oldest first"}</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.events.noEvents}
            </h3>
            <p className="text-gray-500">
              {locale === "ru"
                ? "Следите за обновлениями — скоро появятся новые соревнования"
                : "Stay tuned — new competitions coming soon"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const badge = getStatusBadge(event.status)
            return (
              <Card key={event.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <p className="text-sm text-red-600 mt-1">{event.competency}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {event.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(event.eventStart), "d MMM", { locale: dateLocale })} —{" "}
                        {format(new Date(event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        {locale === "ru" ? "Регистрация до" : "Registration until"} {format(new Date(event.registrationEnd), "d MMMM", { locale: dateLocale })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{event._count.teams} {locale === "ru" ? "команд" : "teams"}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button className="w-full" variant={event.status === "REGISTRATION_OPEN" ? "default" : "outline"}>
                      {event.status === "REGISTRATION_OPEN" ? t.events.apply : t.common.details}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
