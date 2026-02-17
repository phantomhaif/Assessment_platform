"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Users, Search, User, Plus, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string | null
  organization: string | null
  position?: string | null
  phone?: string | null
  role: string
  createdAt: string
  _count: {
    applications: number
    skillPassports: number
  }
}

interface UserFormData {
  email: string
  password: string
  firstName: string
  lastName: string
  middleName: string
  organization: string
  position: string
  phone: string
  role: string
}

const EMPTY_FORM: UserFormData = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  middleName: "",
  organization: "",
  position: "",
  phone: "",
  role: "PARTICIPANT",
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating role:", error)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData(EMPTY_FORM)
    setFormError("")
    setShowModal(true)
  }

  const openEditModal = (user: UserData) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      middleName: user.middleName || "",
      organization: user.organization || "",
      position: user.position || "",
      phone: user.phone || "",
      role: user.role,
    })
    setFormError("")
    setShowModal(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setFormError("")
    setIsSaving(true)
    try {
      if (editingUser) {
        // Edit existing user profile (no email/password change)
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            middleName: formData.middleName || null,
            organization: formData.organization || null,
            position: formData.position || null,
            phone: formData.phone || null,
            role: formData.role,
          }),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t.admin.userUpdated)
        }
      } else {
        // Create new user
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || t.errors.serverError)
        }
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t.errors.serverError)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.firstName.toLowerCase().includes(search.toLowerCase()) ||
      user.lastName.toLowerCase().includes(search.toLowerCase())
  )

  const roleLabels: Record<string, { label: string; color: string }> = {
    ADMIN: { label: t.roles.admin, color: "bg-red-100 text-red-700" },
    ORGANIZER: { label: t.roles.organizer, color: "bg-purple-100 text-purple-700" },
    EXPERT: { label: t.roles.expert, color: "bg-red-100 text-red-700" },
    PARTICIPANT: { label: t.roles.participant, color: "bg-gray-100 text-gray-700" },
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
          <h1 className="text-2xl font-bold text-gray-900">{t.nav.users}</h1>
          <p className="text-gray-500 mt-1">{t.admin.usersSubtitle}</p>
        </div>
        <Button onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          {t.admin.addUser}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t.admin.searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.admin.user}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.common.organization}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.common.role}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {t.admin.statistics}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                {t.common.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => {
              const roleInfo = roleLabels[user.role] || roleLabels.PARTICIPANT
              return (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.lastName} {user.firstName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.organization || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <div className="flex gap-4">
                      <span>{t.admin.applications}: {user._count.applications}</span>
                      <span>{t.admin.passportsCount}: {user._count.skillPassports}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => updateRole(user.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="PARTICIPANT">{t.roles.participant}</option>
                        <option value="EXPERT">{t.roles.expert}</option>
                        <option value="ORGANIZER">{t.roles.organizer}</option>
                        <option value="ADMIN">{t.roles.admin}</option>
                      </select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(user)}
                      >
                        {t.common.edit}
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Modal: Create / Edit User */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">
                {editingUser ? t.admin.editUser : t.admin.addUser}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {formError}
                </div>
              )}
              {!editingUser && (
                <>
                  <Input
                    label={t.common.email + " *"}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleFormChange}
                    required
                  />
                  <Input
                    label={t.common.password + " *"}
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleFormChange}
                    required
                  />
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label={t.auth.lastName + " *"}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                />
                <Input
                  label={t.auth.firstName + " *"}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <Input
                label={t.auth.middleName}
                name="middleName"
                value={formData.middleName}
                onChange={handleFormChange}
              />
              <Input
                label={t.common.organization}
                name="organization"
                value={formData.organization}
                onChange={handleFormChange}
              />
              <Input
                label={t.common.position}
                name="position"
                value={formData.position}
                onChange={handleFormChange}
              />
              <Input
                label={t.common.phone}
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleFormChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.common.role}
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleFormChange}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="PARTICIPANT">{t.roles.participant}</option>
                  <option value="EXPERT">{t.roles.expert}</option>
                  <option value="ORGANIZER">{t.roles.organizer}</option>
                  <option value="ADMIN">{t.roles.admin}</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                {t.common.cancel}
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
