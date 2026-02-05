"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, X, Clock, UserPlus, Search } from "lucide-react"

interface Application {
  id: string
  status: string
  agreedToRegulation: boolean
  comment: string | null
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    organization: string | null
  }
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  organization: string | null
}

export default function AdminApplicationsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [applications, setApplications] = useState<Application[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchApplications()
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchApplications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/applications`)
      if (response.ok) {
        const data = await response.json()
        setApplications(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Error fetching applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: string, status: string) => {
    setProcessingId(applicationId)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/applications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, status }),
      })

      if (response.ok) {
        fetchApplications()
      }
    } catch (error) {
      console.error("Error updating application:", error)
    } finally {
      setProcessingId(null)
    }
  }

  const handleAddParticipant = async (userId: string) => {
    try {
      // Create application directly as approved
      const response = await fetch(`/api/events/${selectedEventId}/applications/manual`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        fetchApplications()
        setShowAddParticipant(false)
        setSearchQuery("")
      } else {
        const data = await response.json()
        alert(data.error || "Ошибка добавления участника")
      }
    } catch (error) {
      console.error("Error adding participant:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { label: "На рассмотрении", className: "bg-yellow-100 text-yellow-700", icon: Clock },
      APPROVED: { label: "Одобрена", className: "bg-green-100 text-green-700", icon: Check },
      REJECTED: { label: "Отклонена", className: "bg-red-100 text-red-700", icon: X },
      WITHDRAWN: { label: "Отозвана", className: "bg-gray-100 text-gray-500", icon: X },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700", icon: Clock }
  }

  const pendingCount = applications.filter(a => a.status === "PENDING").length
  const approvedCount = applications.filter(a => a.status === "APPROVED").length

  const filteredUsers = users.filter(u => {
    const appliedUserIds = applications.map(a => a.user.id)
    const matchesSearch = searchQuery === "" ||
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    return !appliedUserIds.includes(u.id) && matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Заявки на участие</h1>
          <p className="text-gray-500 mt-1">Управление заявками участников</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Мероприятие
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите мероприятие</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedEventId && (
              <Button onClick={() => setShowAddParticipant(!showAddParticipant)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Добавить участника
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showAddParticipant && selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Добавить участника вручную</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Поиск по имени или email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.slice(0, 20).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <div>
                      <p className="font-medium">
                        {user.lastName} {user.firstName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.organization && (
                        <p className="text-xs text-gray-400">{user.organization}</p>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleAddParticipant(user.id)}>
                      Добавить
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    {searchQuery ? "Пользователи не найдены" : "Все пользователи уже добавлены"}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Выберите мероприятие для просмотра заявок
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="flex gap-4">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-gray-500">На рассмотрении</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-sm text-gray-500">Одобрено</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-600">{applications.length}</p>
                <p className="text-sm text-gray-500">Всего заявок</p>
              </CardContent>
            </Card>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Заявок пока нет</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Участник
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Организация
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Дата подачи
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Статус
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {applications.map((app) => {
                      const badge = getStatusBadge(app.status)
                      return (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium">
                                {app.user.lastName} {app.user.firstName}
                              </p>
                              <p className="text-sm text-gray-500">{app.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {app.user.organization || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              <badge.icon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {app.status === "PENDING" && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                  disabled={processingId === app.id}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Одобрить
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                                  disabled={processingId === app.id}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Отклонить
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
