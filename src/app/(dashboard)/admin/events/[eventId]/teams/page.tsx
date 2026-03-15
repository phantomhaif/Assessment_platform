"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Plus, Users, Trash2, UserPlus, X, FileText, Download, ChevronDown, ChevronUp } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface TeamFile {
  id: string
  moduleCode: string
  fileName: string
  fileUrl: string
  fileSize: number
  createdAt: string
  uploadedBy: {
    firstName: string
    lastName: string
  }
}

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
      email: string
    }
  }[]
  files?: TeamFile[]
}

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  organization: string | null
}

interface EventApplication {
  user: User
  status: string
  requestedRole?: string
  approvedRole?: string | null
}

export default function EventTeamsPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { t, locale } = useI18n()
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTeamName, setNewTeamName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [addingToTeamId, setAddingToTeamId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isAutoForming, setIsAutoForming] = useState(false)
  const [expandedFilesTeamId, setExpandedFilesTeamId] = useState<string | null>(null)
  const [loadingFilesTeamId, setLoadingFilesTeamId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
    fetchUsers()
  }, [eventId])

  const fetchData = async () => {
    try {
      const [teamsRes, eventRes] = await Promise.all([
        fetch(`/api/events/${eventId}/teams`),
        fetch(`/api/events/${eventId}`)
      ])

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json()
        setTeams(teamsData)
      }
      if (eventRes.ok) {
        const eventData = await eventRes.json()
        setEvent(eventData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/applications`)
      if (response.ok) {
        const data = await response.json()
        const approvedParticipants = (Array.isArray(data) ? data : [])
          .filter((application: EventApplication) => application.status === "APPROVED")
          .filter((application: EventApplication) =>
            (application.approvedRole ?? application.requestedRole) !== "EXPERT"
          )
          .map((application: EventApplication) => application.user)

        setUsers(approvedParticipants)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchTeamFiles = async (teamId: string) => {
    setLoadingFilesTeamId(teamId)
    try {
      const response = await fetch(`/api/teams/${teamId}/files`)
      if (response.ok) {
        const files = await response.json()
        setTeams(prev => prev.map(t =>
          t.id === teamId ? { ...t, files } : t
        ))
      }
    } catch (error) {
      console.error("Error fetching files:", error)
    } finally {
      setLoadingFilesTeamId(null)
    }
  }

  const toggleFiles = (teamId: string) => {
    if (expandedFilesTeamId === teamId) {
      setExpandedFilesTeamId(null)
    } else {
      setExpandedFilesTeamId(teamId)
      const team = teams.find(t => t.id === teamId)
      if (!team?.files) {
        fetchTeamFiles(teamId)
      }
    }
  }

  const handleAddMember = async (teamId: string, userId: string, role: string = "MEMBER") => {
    setIsAddingMember(true)
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role }),
      })

      if (response.ok) {
        fetchData()
        setAddingToTeamId(null)
        setSearchQuery("")
      } else {
        const data = await response.json()
        alert(data.error || t.applications.addError)
      }
    } catch (error) {
      console.error("Error adding member:", error)
    } finally {
      setIsAddingMember(false)
    }
  }

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    if (!confirm(t.teams.confirmDeleteMember)) return

    try {
      const response = await fetch(`/api/teams/${teamId}/members?memberId=${memberId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error removing member:", error)
    }
  }

  const getAvailableUsers = (team: Team) => {
    const teamMemberIds = team.members.map(m => m.user.id)
    return users.filter(u =>
      !teamMemberIds.includes(u.id) &&
      (searchQuery === "" ||
        u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTeamName.trim()) return

    setIsCreating(true)
    try {
      const response = await fetch(`/api/events/${eventId}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      })

      if (response.ok) {
        setNewTeamName("")
        setShowCreateForm(false)
        fetchData()
      }
    } catch (error) {
      console.error("Error creating team:", error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleAutoFormTeams = async () => {
    if (!confirm(locale === "ru"
      ? "Сформировать команды автоматически по организациям из подтвержденных заявок участников?"
      : "Auto-form teams by organization from approved participant applications?")) {
      return
    }

    setIsAutoForming(true)
    try {
      const response = await fetch(`/api/events/${eventId}/teams/auto`, {
        method: "POST",
      })

      if (response.ok) {
        await Promise.all([fetchData(), fetchUsers()])
      } else {
        const data = await response.json()
        alert(data.error || (locale === "ru" ? "Не удалось сформировать команды" : "Failed to auto-form teams"))
      }
    } catch (error) {
      console.error("Error auto-forming teams:", error)
    } finally {
      setIsAutoForming(false)
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm(t.teams.confirmDeleteTeam)) return

    try {
      const response = await fetch(`/api/events/${eventId}/teams?teamId=${teamId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error("Error deleting team:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    const isRu = locale === "ru"
    if (bytes < 1024) return bytes + (isRu ? " Б" : " B")
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + (isRu ? " КБ" : " KB")
    return (bytes / (1024 * 1024)).toFixed(1) + (isRu ? " МБ" : " MB")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Link href={`/admin/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t.teams.title}</h1>
            <p className="text-gray-500">{event?.name}</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button onClick={handleAutoFormTeams} variant="outline" disabled={isAutoForming} className="w-full sm:w-auto">
            <Users className="h-4 w-4 mr-2" />
            {locale === "ru" ? "Сформировать автоматически" : "Auto-form teams"}
          </Button>
          <Button onClick={() => setShowCreateForm(true)} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t.teams.createTeam}
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>{t.teams.newTeam}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateTeam} className="flex flex-col gap-3 sm:flex-row">
              <Input
                placeholder={t.teams.teamNamePlaceholder}
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={isCreating} className="w-full sm:w-auto">
                {isCreating ? t.teams.creating : t.common.create}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="w-full sm:w-auto"
              >
                {t.common.cancel}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.teams.noTeams}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {team.number && `#${team.number} `}
                    {team.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {team.members.length} {t.teams.membersCount}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFiles(team.id)}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    {t.teams.filesButton}
                    {expandedFilesTeamId === team.id ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAddingToTeamId(addingToTeamId === team.id ? null : team.id)}
                  >
                    <UserPlus className="h-4 w-4 mr-1" />
                    {t.teams.addMember}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Files section */}
                {expandedFilesTeamId === team.id && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">{t.teams.filesSection}</h4>
                    {loadingFilesTeamId === team.id ? (
                      <p className="text-sm text-gray-500">{t.common.loading}</p>
                    ) : team.files && team.files.length > 0 ? (
                      <div className="space-y-2">
                        {team.files.map((file) => (
                          <div
                            key={file.id}
                            className="flex flex-col gap-3 rounded border bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {t.scoring.module} {file.moduleCode}: {file.fileName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatFileSize(file.fileSize)} • {t.teams.uploadedBy}: {file.uploadedBy.lastName} {file.uploadedBy.firstName}
                              </p>
                            </div>
                            <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-1" />
                                {t.common.download}
                              </Button>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">{t.teams.noFilesYet}</p>
                    )}
                  </div>
                )}

                {addingToTeamId === team.id && (
                  <div className="mb-4 p-4 bg-red-50 rounded-lg">
                    <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <h4 className="font-medium text-red-900">{t.teams.addMember}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAddingToTeamId(null)
                          setSearchQuery("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      placeholder={t.applications.searchByNameOrEmail}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="mb-2"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {getAvailableUsers(team).slice(0, 10).map((user) => (
                        <div
                          key={user.id}
                          className="flex flex-col gap-2 rounded bg-white p-2 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {user.lastName} {user.firstName}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddMember(team.id, user.id, "MEMBER")}
                            disabled={isAddingMember}
                          >
                            {t.applications.add}
                          </Button>
                        </div>
                      ))}
                      {getAvailableUsers(team).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          {searchQuery ? t.applications.usersNotFound : t.applications.allUsersAdded}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {team.members.length === 0 ? (
                  <p className="text-sm text-gray-500">{t.teams.noMembers}</p>
                ) : (
                  <div className="space-y-2">
                    {team.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex flex-col gap-2 rounded bg-gray-50 p-2 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium">
                            <Link
                              href={`/admin/users/${member.user.id}/profile`}
                              className="text-[#C41E3A] hover:underline"
                            >
                              {member.user.lastName} {member.user.firstName}
                            </Link>
                          </p>
                          <p className="text-sm text-gray-500">{member.user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                            {t.teams.member}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(team.id, member.id)}
                          >
                            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
