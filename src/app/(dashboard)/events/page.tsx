"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Calendar, MapPin, Users, Clock } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

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
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Черновик", className: "bg-gray-100 text-gray-700" },
      REGISTRATION_OPEN: { label: "Регистрация открыта", className: "bg-green-100 text-green-700" },
      REGISTRATION_CLOSED: { label: "Регистрация закрыта", className: "bg-yellow-100 text-yellow-700" },
      IN_PROGRESS: { label: "Идёт мероприятие", className: "bg-red-100 text-red-700" },
      SCORING: { label: "Оценивание", className: "bg-purple-100 text-purple-700" },
      RESULTS_PUBLISHED: { label: "Результаты опубликованы", className: "bg-green-100 text-green-700" },
      ARCHIVED: { label: "Архив", className: "bg-gray-100 text-gray-500" },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700" }
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
        <h1 className="text-2xl font-bold text-gray-900">Мероприятия</h1>
        <p className="text-gray-500 mt-1">Доступные соревнования и чемпионаты</p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет доступных мероприятий
            </h3>
            <p className="text-gray-500">
              Следите за обновлениями — скоро появятся новые соревнования
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
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
                        {format(new Date(event.eventStart), "d MMM", { locale: ru })} —{" "}
                        {format(new Date(event.eventEnd), "d MMM yyyy", { locale: ru })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>
                        Регистрация до {format(new Date(event.registrationEnd), "d MMMM", { locale: ru })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{event._count.teams} команд</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button className="w-full" variant={event.status === "REGISTRATION_OPEN" ? "default" : "outline"}>
                      {event.status === "REGISTRATION_OPEN" ? "Подать заявку" : "Подробнее"}
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
