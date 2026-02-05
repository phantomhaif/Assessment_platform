"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Plus, UserPlus } from "lucide-react"

interface Team {
  id: string
  name: string
  number: number | null
  members: {
    id: string
    role: string
    user: {
      id: string
      firstName: string
      lastName: string
      organization: string | null
    }
  }[]
  event: {
    id: string
    name: string
  }
}

export default function AdminTeamsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchTeams()
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

  const fetchTeams = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/teams`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const createTeam = async () => {
    if (!newTeamName.trim() || !selectedEventId) return

    try {
      const response = await fetch(`/api/events/${selectedEventId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTeamName,
          number: teams.length + 1,
        }),
      })

      if (response.ok) {
        setNewTeamName("")
        setShowCreateForm(false)
        fetchTeams()
      }
    } catch (error) {
      console.error("Error creating team:", error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление командами</h1>
          <p className="text-gray-500 mt-1">Формирование и редактирование команд</p>
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
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Создать команду
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Новая команда</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Название команды"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={createTeam}>Создать</Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Выберите мероприятие для просмотра команд
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет команд</h3>
            <p className="text-gray-500">Создайте первую команду для этого мероприятия</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {team.number && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm">
                      #{team.number}
                    </span>
                  )}
                  {team.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {team.members.length === 0 ? (
                  <p className="text-gray-500 text-sm">Нет участников</p>
                ) : (
                  <ul className="space-y-2">
                    {team.members.map((member) => (
                      <li key={member.id} className="flex items-center gap-2 text-sm">
                        <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                          {member.user.firstName[0]}
                          {member.user.lastName[0]}
                        </div>
                        <div>
                          <p className="font-medium">
                            {member.user.lastName} {member.user.firstName}
                            {member.role === "CAPTAIN" && (
                              <span className="text-yellow-600 ml-1">(капитан)</span>
                            )}
                          </p>
                          {member.user.organization && (
                            <p className="text-gray-500 text-xs">{member.user.organization}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Button variant="outline" size="sm" className="w-full mt-4">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Добавить участника
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
