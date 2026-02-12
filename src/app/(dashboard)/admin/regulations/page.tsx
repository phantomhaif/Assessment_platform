"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText, Plus, Edit, Trash2, Users, Calendar } from "lucide-react"

interface Event {
  id: string
  name: string
  status: string
}

interface Protocol {
  id: string
  title: string
  version: number
  eventId: string
  eventName: string
  createdAt: string
  _count: {
    assignments: number
    signatures: number
  }
}

export default function AdminRegulationsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [protocols, setProtocols] = useState<Protocol[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchProtocols()
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchProtocols = async () => {
    try {
      const response = await fetch(`/api/admin/protocols?eventId=${selectedEventId}`)
      if (response.ok) {
        const data = await response.json()
        setProtocols(data)
      }
    } catch (error) {
      console.error("Error fetching protocols:", error)
    }
  }

  const handleDelete = async (protocolId: string) => {
    if (!confirm("Удалить регламент? Все назначения и подписи будут удалены.")) return

    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setProtocols(protocols.filter((p) => p.id !== protocolId))
      }
    } catch (error) {
      console.error("Error deleting protocol:", error)
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление регламентами</h1>
          <p className="text-gray-500 mt-1">
            Создавайте регламенты и назначайте их участникам мероприятий
          </p>
        </div>
        {selectedEventId && (
          <Link href={`/admin/regulations/new?eventId=${selectedEventId}`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Создать регламент
            </Button>
          </Link>
        )}
      </div>

      {/* Event selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Выберите мероприятие
          </CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
          >
            <option value="">Выберите мероприятие</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Protocols list */}
      {selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Регламенты мероприятия
            </CardTitle>
          </CardHeader>
          <CardContent>
            {protocols.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Регламенты для этого мероприятия еще не созданы
                </p>
                <Link href={`/admin/regulations/new?eventId=${selectedEventId}`}>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первый регламент
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {protocols.map((protocol) => (
                  <div
                    key={protocol.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{protocol.title}</h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>Версия {protocol.version}</span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          Назначено: {protocol._count.assignments}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Подписано: {protocol._count.signatures}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/regulations/${protocol.id}/assign`}>
                        <Button variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-2" />
                          Назначить
                        </Button>
                      </Link>
                      <Link href={`/admin/regulations/${protocol.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(protocol.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
