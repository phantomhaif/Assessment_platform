"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Calendar, Users, Edit, Trash2, Eye, Upload } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

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
    if (!confirm(`Вы уверены, что хотите удалить мероприятие "${eventName}"?\n\nЭто действие нельзя отменить. Все связанные данные (команды, заявки, оценки) будут удалены.`)) {
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
        alert(data.error || "Ошибка удаления мероприятия")
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Ошибка удаления мероприятия")
    } finally {
      setDeletingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      DRAFT: { label: "Черновик", className: "bg-gray-100 text-gray-700" },
      REGISTRATION_OPEN: { label: "Регистрация", className: "bg-green-100 text-green-700" },
      REGISTRATION_CLOSED: { label: "Рег. закрыта", className: "bg-yellow-100 text-yellow-700" },
      IN_PROGRESS: { label: "В процессе", className: "bg-blue-100 text-blue-700" },
      SCORING: { label: "Оценивание", className: "bg-purple-100 text-purple-700" },
      RESULTS_PUBLISHED: { label: "Опубликовано", className: "bg-green-100 text-green-700" },
      ARCHIVED: { label: "Архив", className: "bg-gray-100 text-gray-500" },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700" }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление мероприятиями</h1>
          <p className="text-gray-500 mt-1">Создание и редактирование соревнований</p>
        </div>
        <Link href="/admin/events/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Создать мероприятие
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет мероприятий
            </h3>
            <p className="text-gray-500 mb-4">
              Создайте первое мероприятие для начала работы
            </p>
            <Link href="/admin/events/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Создать мероприятие
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Мероприятие
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Даты
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Команды
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Заявки
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map((event) => {
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
                      {format(new Date(event.eventStart), "d MMM", { locale: ru })} —{" "}
                      {format(new Date(event.eventEnd), "d MMM yyyy", { locale: ru })}
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
                          <Button variant="ghost" size="icon" title="Схема оценки">
                            <Upload className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEvent(event.id, event.name)}
                          disabled={deletingId === event.id}
                          title="Удалить"
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
