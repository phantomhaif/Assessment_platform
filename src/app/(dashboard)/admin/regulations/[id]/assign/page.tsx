"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Users, UserCheck } from "lucide-react"

interface Protocol {
  id: string
  title: string
  eventId: string
  eventName: string
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  organization: string | null
}

interface Assignment {
  userId: string
}

export default function AssignRegulationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: protocolId } = use(params)
  const router = useRouter()

  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const [selectedRole, setSelectedRole] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    fetchData()
  }, [protocolId])

  const fetchData = async () => {
    try {
      const [protocolRes, usersRes, assignmentsRes] = await Promise.all([
        fetch(`/api/admin/protocols/${protocolId}`),
        fetch(`/api/admin/protocols/${protocolId}/available-users`),
        fetch(`/api/admin/protocols/${protocolId}/assignments`),
      ])

      if (protocolRes.ok) {
        const protocolData = await protocolRes.json()
        setProtocol(protocolData)
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData)
        setSelectedUserIds(new Set(assignmentsData.map((a: Assignment) => a.userId)))
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRoleSelect = (role: string) => {
    if (role === selectedRole) {
      setSelectedRole("")
      return
    }

    setSelectedRole(role)
    const roleUsers = users.filter((u) => u.role === role)
    const newSelectedIds = new Set(selectedUserIds)

    roleUsers.forEach((user) => {
      newSelectedIds.add(user.id)
    })

    setSelectedUserIds(newSelectedIds)
  }

  const handleUserToggle = (userId: string) => {
    const newSelectedIds = new Set(selectedUserIds)
    if (newSelectedIds.has(userId)) {
      newSelectedIds.delete(userId)
    } else {
      newSelectedIds.add(userId)
    }
    setSelectedUserIds(newSelectedIds)
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userIds: Array.from(selectedUserIds),
        }),
      })

      if (response.ok) {
        setSuccess("Назначения успешно сохранены")
        setTimeout(() => {
          router.push("/admin/regulations")
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка сохранения")
      }
    } catch (error) {
      setError("Ошибка при сохранении")
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ADMIN: "Администраторы",
      ORGANIZER: "Организаторы",
      EXPERT: "Эксперты",
      PARTICIPANT: "Участники",
    }
    return roleNames[role] || role
  }

  const roleGroups = ["PARTICIPANT", "EXPERT", "ORGANIZER", "ADMIN"]
  const usersByRole = roleGroups.reduce((acc, role) => {
    acc[role] = users.filter((u) => u.role === role)
    return acc
  }, {} as Record<string, User[]>)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Регламент не найден</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Назначить регламент</h1>
          <p className="text-gray-500 mt-1">{protocol.title}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Role selector */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Выбор по ролям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {roleGroups.map((role) => {
                const count = usersByRole[role]?.length || 0
                if (count === 0) return null

                const selectedCount = usersByRole[role]?.filter((u) =>
                  selectedUserIds.has(u.id)
                ).length || 0

                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      selectedCount === count
                        ? "border-red-600 bg-red-50"
                        : "border-gray-200 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">
                        {getRoleName(role)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {selectedCount}/{count}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Users list */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Выбранные пользователи
                </span>
                <span className="text-sm text-gray-500 font-normal">
                  {selectedUserIds.size} из {users.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleGroups.map((role) => {
                  const roleUsers = usersByRole[role] || []
                  if (roleUsers.length === 0) return null

                  return (
                    <div key={role}>
                      <h3 className="font-medium text-gray-900 mb-2">
                        {getRoleName(role)}
                      </h3>
                      <div className="space-y-1">
                        {roleUsers.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(user.id)}
                              onChange={() => handleUserToggle(user.id)}
                              className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                {user.email}
                                {user.organization && ` • ${user.organization}`}
                              </p>
                            </div>
                            {selectedUserIds.has(user.id) && (
                              <UserCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Link href="/admin/regulations">
          <Button variant="outline">Отмена</Button>
        </Link>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          Сохранить назначения
        </Button>
      </div>
    </div>
  )
}
