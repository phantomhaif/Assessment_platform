"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, Users, UserCheck } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

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
  const { t } = useI18n()
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
    const roleUsers = users.filter((u) => u.role === role)
    const newSelectedIds = new Set(selectedUserIds)
    const allSelected = roleUsers.length > 0 && roleUsers.every((user) => newSelectedIds.has(user.id))

    roleUsers.forEach((user) => {
      if (allSelected) {
        newSelectedIds.delete(user.id)
      } else {
        newSelectedIds.add(user.id)
      }
    })

    setSelectedRole(allSelected || role === selectedRole ? "" : role)
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
        setSuccess(t.regulationsAdmin.assignedSuccessfully)
        setTimeout(() => {
          router.push("/admin/regulations")
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || t.regulationsAdmin.saveError)
      }
    } catch (error) {
      setError(t.regulationsAdmin.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ADMIN: t.roles.adminPlural,
      ORGANIZER: t.roles.organizerPlural,
      EXPERT: t.roles.expertPlural,
      PARTICIPANT: t.roles.participantPlural,
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
        <p className="text-gray-500">{t.regulations.notFound}</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link href="/admin/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.regulationsAdmin.assignTitle}</h1>
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
            <CardTitle className="text-lg">{t.regulationsAdmin.selectByRoles}</CardTitle>
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
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
              <CardTitle className="flex flex-col gap-2 text-lg sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {t.regulationsAdmin.selectedUsers}
                </span>
                <span className="text-sm text-gray-500 font-normal">
                  {selectedUserIds.size} {t.regulationsAdmin.ofText} {users.length}
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href="/admin/regulations">
          <Button variant="outline" className="w-full sm:w-auto">{t.common.cancel}</Button>
        </Link>
        <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {t.regulationsAdmin.saveAssignments}
        </Button>
      </div>
    </div>
  )
}
