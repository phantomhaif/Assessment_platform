"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, X, Clock, UserPlus, Search } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Application {
  id: string
  status: string
  requestedRole: "PARTICIPANT" | "EXPERT"
  approvedRole: "PARTICIPANT" | "EXPERT" | null
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
  const [manualRole, setManualRole] = useState<"PARTICIPANT" | "EXPERT">("PARTICIPANT")
  const [roleSelections, setRoleSelections] = useState<Record<string, "PARTICIPANT" | "EXPERT">>({})
  const { t, locale } = useI18n()

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
        const nextApplications = Array.isArray(data) ? data : []
        setApplications(nextApplications)
        setRoleSelections(
          nextApplications.reduce<Record<string, "PARTICIPANT" | "EXPERT">>((acc, application) => {
            acc[application.id] = (application.approvedRole ?? application.requestedRole ?? "PARTICIPANT")
            return acc
          }, {})
        )
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
        body: JSON.stringify({
          applicationId,
          status,
          approvedRole: roleSelections[applicationId] || "PARTICIPANT",
        }),
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
        body: JSON.stringify({ userId, requestedRole: manualRole }),
      })

      if (response.ok) {
        fetchApplications()
        setShowAddParticipant(false)
        setSearchQuery("")
      } else {
        const data = await response.json()
        alert(data.error || t.applications.addError)
      }
    } catch (error) {
      console.error("Error adding participant:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      PENDING: { label: t.applications.pending, className: "bg-yellow-100 text-yellow-700", icon: Clock },
      APPROVED: { label: t.applications.approved, className: "bg-green-100 text-green-700", icon: Check },
      REJECTED: { label: t.applications.rejected, className: "bg-red-100 text-red-700", icon: X },
      WITHDRAWN: { label: t.applications.withdrawn, className: "bg-gray-100 text-gray-500", icon: X },
    }
    return badges[status] || { label: status, className: "bg-gray-100 text-gray-700", icon: Clock }
  }

  const getRoleLabel = (role: "PARTICIPANT" | "EXPERT" | null | undefined) => {
    if (role === "EXPERT") return t.roles.expert
    return t.roles.participant
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.applications.title}</h1>
          <p className="text-gray-500 mt-1">{t.applications.subtitle}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.nav.events}
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t.applications.selectEvent}</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedEventId && (
              <Button onClick={() => setShowAddParticipant(!showAddParticipant)} className="w-full md:w-auto">
                <UserPlus className="h-4 w-4 mr-2" />
                {t.applications.addParticipant}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showAddParticipant && selectedEventId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.applications.addParticipantManually}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.applications.searchByNameOrEmail}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700">
                  {locale === "ru" ? "Роль" : "Role"}
                </label>
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value as "PARTICIPANT" | "EXPERT")}
                  className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="PARTICIPANT">{t.roles.participant}</option>
                  <option value="EXPERT">{t.roles.expert}</option>
                </select>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {filteredUsers.slice(0, 20).map((user) => (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 hover:bg-gray-100 sm:flex-row sm:items-center sm:justify-between"
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
                      {t.applications.add}
                    </Button>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    {searchQuery ? t.applications.usersNotFound : t.applications.allUsersAdded}
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
            {t.applications.selectEventToView}
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-gray-500">{t.applications.pending}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
                <p className="text-sm text-gray-500">{t.applications.approved}</p>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardContent className="p-4 text-center">
                <p className="text-3xl font-bold text-gray-600">{applications.length}</p>
                <p className="text-sm text-gray-500">{t.applications.totalApplications}</p>
              </CardContent>
            </Card>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t.applications.noApplications}</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-4 md:hidden">
                <div className="space-y-3">
                  {applications.map((app) => {
                    const badge = getStatusBadge(app.status)
                    return (
                      <div key={app.id} className="space-y-3 rounded-xl border border-gray-200 p-4">
                        <div>
                          <Link
                            href={`/admin/users/${app.user.id}/profile`}
                            className="font-medium text-[#C41E3A] hover:underline"
                          >
                            {app.user.lastName} {app.user.firstName}
                          </Link>
                          <p className="break-all text-sm text-gray-500">{app.user.email}</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.common.organization}</p>
                            <p className="mt-1 break-words text-sm text-gray-600">{app.user.organization || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.applications.submissionDate}</p>
                            <p className="mt-1 text-sm text-gray-600">{new Date(app.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{locale === "ru" ? "Роль" : "Role"}</p>
                            <p className="mt-1 text-sm text-gray-600">
                              {getRoleLabel(app.requestedRole)}
                              {app.approvedRole && app.approvedRole !== app.requestedRole ? ` → ${getRoleLabel(app.approvedRole)}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${badge.className}`}>
                          <badge.icon className="h-3 w-3" />
                          {badge.label}
                        </span>
                        {app.status === "PENDING" && (
                          <div className="grid grid-cols-1 gap-2">
                            <select
                              value={roleSelections[app.id] || app.requestedRole || "PARTICIPANT"}
                              onChange={(e) =>
                                setRoleSelections((prev) => ({
                                  ...prev,
                                  [app.id]: e.target.value as "PARTICIPANT" | "EXPERT",
                                }))
                              }
                              className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="PARTICIPANT">{t.roles.participant}</option>
                              <option value="EXPERT">{t.roles.expert}</option>
                            </select>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                              disabled={processingId === app.id}
                            >
                              <Check className="mr-1 h-4 w-4" />
                              {t.applications.approve}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                              disabled={processingId === app.id}
                            >
                              <X className="mr-1 h-4 w-4" />
                              {t.applications.reject}
                            </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
              <CardContent className="hidden p-0 md:block">
                <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t.applications.participant}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t.common.organization}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t.applications.submissionDate}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {locale === "ru" ? "Роль" : "Role"}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {t.common.status}
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        {t.common.actions}
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
                              <Link
                                href={`/admin/users/${app.user.id}/profile`}
                                className="font-medium text-[#C41E3A] hover:underline"
                              >
                                {app.user.lastName} {app.user.firstName}
                              </Link>
                              <p className="text-sm text-gray-500">{app.user.email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {app.user.organization || "—"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US")}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{getRoleLabel(app.requestedRole)}</div>
                            {app.approvedRole && app.approvedRole !== app.requestedRole && (
                              <div className="text-xs text-gray-400">
                                → {getRoleLabel(app.approvedRole)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                              <badge.icon className="h-3 w-3" />
                              {badge.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {app.status === "PENDING" && (
                              <div className="flex flex-col items-end gap-2">
                                <select
                                  value={roleSelections[app.id] || app.requestedRole || "PARTICIPANT"}
                                  onChange={(e) =>
                                    setRoleSelections((prev) => ({
                                      ...prev,
                                      [app.id]: e.target.value as "PARTICIPANT" | "EXPERT",
                                    }))
                                  }
                                  className="h-9 min-w-[9rem] rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                  <option value="PARTICIPANT">{t.roles.participant}</option>
                                  <option value="EXPERT">{t.roles.expert}</option>
                                </select>
                                <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateStatus(app.id, "APPROVED")}
                                  disabled={processingId === app.id}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  {t.applications.approve}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleUpdateStatus(app.id, "REJECTED")}
                                  disabled={processingId === app.id}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  {t.applications.reject}
                                </Button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
