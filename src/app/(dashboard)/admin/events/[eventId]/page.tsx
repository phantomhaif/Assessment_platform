"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Edit, Upload, Users, Play, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

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
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
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
        alert("Результаты опубликованы! Skill Passport доступны участникам.")
        fetchEvent()
      }
    } catch (error) {
      console.error("Error publishing results:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!event) {
    return <div>Мероприятие не найдено</div>
  }

  const statusLabels: Record<string, string> = {
    DRAFT: "Черновик",
    REGISTRATION_OPEN: "Регистрация открыта",
    REGISTRATION_CLOSED: "Регистрация закрыта",
    IN_PROGRESS: "В процессе",
    SCORING: "Оценивание",
    RESULTS_PUBLISHED: "Результаты опубликованы",
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
              Редактировать
            </Button>
          </Link>
          <Link href={`/admin/events/${eventId}/schema`}>
            <Button variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Схема оценки
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Статус</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600 mb-4">
              {statusLabels[event.status] || event.status}
            </p>
            <div className="space-y-2">
              {event.status === "DRAFT" && (
                <Button onClick={() => updateStatus("REGISTRATION_OPEN")} className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Открыть регистрацию
                </Button>
              )}
              {event.status === "REGISTRATION_OPEN" && (
                <Button onClick={() => updateStatus("REGISTRATION_CLOSED")} className="w-full">
                  Закрыть регистрацию
                </Button>
              )}
              {event.status === "REGISTRATION_CLOSED" && (
                <Button onClick={() => updateStatus("IN_PROGRESS")} className="w-full">
                  Начать мероприятие
                </Button>
              )}
              {event.status === "IN_PROGRESS" && (
                <Button onClick={() => updateStatus("SCORING")} className="w-full">
                  Перейти к оценке
                </Button>
              )}
              {event.status === "SCORING" && (
                <Button onClick={publishResults} className="w-full">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Опубликовать результаты
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Даты</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Регистрация:</span>
              <p className="font-medium">
                {format(new Date(event.registrationStart), "d MMM", { locale: ru })} —{" "}
                {format(new Date(event.registrationEnd), "d MMM yyyy", { locale: ru })}
              </p>
            </div>
            <div>
              <span className="text-gray-500">Мероприятие:</span>
              <p className="font-medium">
                {format(new Date(event.eventStart), "d MMM", { locale: ru })} —{" "}
                {format(new Date(event.eventEnd), "d MMM yyyy", { locale: ru })}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Участники</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Команд:</span>
                <span className="font-bold">{event._count.teams}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Заявок:</span>
                <span className="font-bold">{event._count.applications}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Размер команды:</span>
                <span className="font-medium">{event.minTeamSize}-{event.maxTeamSize}</span>
              </div>
            </div>
            <Link href={`/admin/events/${eventId}/teams`}>
              <Button variant="outline" className="w-full mt-4">
                <Users className="h-4 w-4 mr-2" />
                Управление командами
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {event.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{event.description}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Схема оценки</CardTitle>
        </CardHeader>
        <CardContent>
          {event.assessmentSchema ? (
            <div>
              <p className="text-green-600 font-medium">Загружена: {event.assessmentSchema.name}</p>
              <Link href={`/admin/events/${eventId}/schema`}>
                <Button variant="outline" className="mt-2">
                  Изменить схему
                </Button>
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-500 mb-2">Схема оценки не загружена</p>
              <Link href={`/admin/events/${eventId}/schema`}>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить Excel
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
