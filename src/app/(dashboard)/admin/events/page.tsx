"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, Users, Edit, Trash2, Eye, Upload, Filter } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"

interface Event {
  id: string
  name: string
  competency: string
  status: string
  eventStart: string
  eventEnd: string
  _count: {
    teams: number
    applications: number
  }
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
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

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    const confirmMsg = t.events.confirmDeleteEvent.replace("{name}", eventName)
    if (!confirm(confirmMsg)) {
      return
    }

    setDeletingId(eventId)
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchEvents()
      } else {
        const data = await response.json()
        alert(data.error || t.events.deleteError)
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert(t.events.deleteError)
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: t.events.status.draft, className: "bg-gray-100 text-gray-700" },
      REGISTRATION_OPEN: { label: t.events.status.registration_open, className: "bg-green-100 text-green-700" },
      REGISTRATION_CLOSED: { label: t.events.status.registration_closed, className: "bg-yellow-100 text-yellow-700" },
      IN_PROGRESS: { label: t.events.status.in_progress, className: "bg-red-100 text-red-700" },
      SCORING: { label: t.events.status.scoring, className: "bg-purple-100 text-purple-700" },
      RESULTS_PUBLISHED: { label: t.events.status.results_published, className: "bg-green-100 text-green-700" },
      ARCHIVED: { label: t.events.status.archived, className: "bg-gray-100 text-gray-500" },
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.events.manageEvents}</h1>
          <p className="text-gray-500 mt-1">{t.events.manageEventsSubtitle}</p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {t.events.createEvent}
          </Button>
        </Link>
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

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : filteredEvents.length === 0 && events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.events.noEventsAdmin}
            </h3>
            <p className="text-gray-500 mb-4">
              {t.events.createFirstEvent}
            </p>
            <Link href="/admin/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t.events.createEvent}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.events.noEvents}
            </h3>
            <p className="text-gray-500">
              {locale === "ru"
                ? "Не найдено событий, соответствующих выбранным фильтрам"
                : "No events found matching the selected filters"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.nav.events}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.events.dates}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.common.status}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.nav.teams}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.nav.applications}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t.common.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEvents.map((event) => {
                const badge = getStatusBadge(event.status)
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{event.name}</p>
                        <p className="text-sm text-gray-500">{event.competency}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(event.eventStart), "d MMM", { locale: dateLocale })} —{" "}
                      {format(new Date(event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event._count.teams}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {event._count.applications}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/events/${event.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/admin/events/${event.id}/schema`}>
                          <Button variant="ghost" size="icon" title={t.nav.schemas}>
                            <Upload className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          disabled={deletingId === event.id}
                          title={t.common.delete}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
