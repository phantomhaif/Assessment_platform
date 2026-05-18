"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, User, Plus, X, Trash2 } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string | null
  organization: string | null
  photo: string | null
  position?: string | null
  phone?: string | null
  role: string
  createdAt: string
  _count: {
    applications: number
    skillPassports: number
  }
}

interface ProfileField {
  id: string
  name: string
  nameEn: string
  type: "TEXT" | "TEXTAREA" | "SELECT" | "DATE"
  required: boolean
  options: string[]
  optionsEn: string[]
  order: number
}

interface CustomFieldValue {
  fieldId: string
  value: string
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
  customFields: Record<string, string>
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
  customFields: {},
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedRole, setSelectedRole] = useState<string>("ALL")
  const [onlyWithoutPhoto, setOnlyWithoutPhoto] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [formData, setFormData] = useState<UserFormData>(EMPTY_FORM)
  const [formError, setFormError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [profileFields, setProfileFields] = useState<ProfileField[]>([])
  const { t, locale } = useI18n()

  useEffect(() => {
    fetchUsers()
    fetchProfileFields()
  }, [])

  const fetchProfileFields = async () => {
    try {
      const response = await fetch("/api/profile-fields")
      if (response.ok) {
        const data = await response.json()
        setProfileFields(data)
      }
    } catch (error) {
      console.error("Error fetching profile fields:", error)
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

  const deleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(t.admin.confirmDelete.replace("{name}", userName))) return
    try {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" })
      if (response.ok) {
        fetchUsers()
      }
    } catch (error) {
      console.error("Error deleting user:", error)
    }
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData(EMPTY_FORM)
    setFormError("")
    setShowModal(true)
  }

  const openEditModal = async (user: UserData) => {
    setEditingUser(user)

    // Fetch user's custom field values
    const customFields: Record<string, string> = {}
    try {
      const response = await fetch(`/api/users/${user.id}`)
      if (response.ok) {
        const userData = await response.json()
        userData.customFieldValues?.forEach((cfv: CustomFieldValue) => {
          customFields[cfv.fieldId] = cfv.value
        })
      }
    } catch (error) {
      console.error("Error fetching custom fields:", error)
    }

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
      customFields,
    })
    setFormError("")
    setShowModal(true)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      customFields: { ...prev.customFields, [fieldId]: value }
    }))
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
            customFields: formData.customFields,
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
    (user) => {
      const matchesSearch = user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase())
      const matchesRole = selectedRole === "ALL" || user.role === selectedRole
      const matchesPhoto = !onlyWithoutPhoto || !user.photo
      return matchesSearch && matchesRole && matchesPhoto
    }
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.nav.users}</h1>
          <p className="text-gray-500 mt-1">{t.admin.usersSubtitle}</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {t.admin.addUser}
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.admin.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 md:w-48"
            >
              <option value="ALL">{t.common.all} {t.nav.users.toLowerCase()}</option>
              <option value="PARTICIPANT">{t.roles.participant}</option>
              <option value="EXPERT">{t.roles.expert}</option>
              <option value="ORGANIZER">{t.roles.organizer}</option>
              <option value="ADMIN">{t.roles.admin}</option>
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={onlyWithoutPhoto}
                onChange={(event) => setOnlyWithoutPhoto(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              {locale === "ru" ? "Только без фото" : "Only without photo"}
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3 md:hidden">
        {filteredUsers.map((user) => {
          const roleInfo = roleLabels[user.role] || roleLabels.PARTICIPANT
          return (
            <Card key={user.id}>
              <CardContent className="space-y-4 p-4">
                <div className="flex items-start gap-3">
                  {user.photo ? (
                    <a href={user.photo} target="_blank" rel="noopener noreferrer">
                      <img src={user.photo} alt="" className="h-[52px] w-10 shrink-0 rounded-md object-cover" />
                    </a>
                  ) : (
                    <div className="flex h-[52px] w-10 shrink-0 items-center justify-center rounded-md bg-gray-100 text-[10px] text-gray-500">
                      {locale === "ru" ? "Нет фото" : "No photo"}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/users/${user.id}/profile`} className="font-medium text-gray-900 hover:text-[#C41E3A]">
                      {user.lastName} {user.firstName}
                    </Link>
                    <p className="break-all text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t.common.organization}
                    </p>
                    <p className="mt-1 break-words text-sm text-gray-600">
                      {user.organization || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t.common.role}
                    </p>
                    <div className="mt-1">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl bg-gray-50 p-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t.admin.applications}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-700">{user._count.applications}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      {t.admin.passportsCount}
                    </p>
                    <p className="mt-1 text-sm font-medium text-gray-700">{user._count.skillPassports}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <select
                    value={user.role}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="PARTICIPANT">{t.roles.participant}</option>
                    <option value="EXPERT">{t.roles.expert}</option>
                    <option value="ORGANIZER">{t.roles.organizer}</option>
                    <option value="ADMIN">{t.roles.admin}</option>
                  </select>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEditModal(user)}
                    >
                      {t.common.edit}
                    </Button>
                    <Button
                      variant="outline"
                      className="px-3 text-red-600 hover:bg-red-50"
                      onClick={() => deleteUser(user.id, `${user.lastName} ${user.firstName}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
        <table className="w-full min-w-[960px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {locale === "ru" ? "Фото" : "Photo"}
              </th>
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
                    {user.photo ? (
                      <a href={user.photo} target="_blank" rel="noopener noreferrer">
                        <img src={user.photo} alt="" className="h-[52px] w-10 rounded-md object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-[52px] w-10 items-center justify-center rounded-md bg-gray-100 text-[10px] leading-tight text-gray-500">
                        {locale === "ru" ? "Нет фото" : "No photo"}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <Link href={`/admin/users/${user.id}/profile`} className="font-medium hover:text-[#C41E3A]">
                          {user.lastName} {user.firstName}
                        </Link>
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                        onClick={() => deleteUser(user.id, `${user.lastName} ${user.firstName}`)}
                      >
                        <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
          <div className="modal-panel bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b p-6">
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              {/* Custom Fields */}
              {editingUser && profileFields.length > 0 && (
                <>
                  <div className="mt-2 border-t pt-4 sm:col-span-2">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">
                      {locale === "ru" ? "Дополнительные поля" : "Additional Fields"}
                    </h3>
                  </div>
                  {profileFields.map((field) => {
                    const fieldName = locale === "ru" ? field.name : field.nameEn
                    const fieldValue = formData.customFields[field.id] || ""

                    return (
                      <div key={field.id} className={field.type === "TEXTAREA" ? "sm:col-span-2" : ""}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {fieldName}{field.required ? " *" : ""}
                        </label>
                        {field.type === "TEXT" && (
                          <input
                            type="text"
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        )}
                        {field.type === "TEXTAREA" && (
                          <textarea
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        )}
                        {field.type === "SELECT" && (
                          <select
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            <option value="">{locale === "ru" ? "Выберите..." : "Select..."}</option>
                            {(locale === "ru" ? field.options : field.optionsEn).map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.type === "DATE" && (
                          <input
                            type="date"
                            value={fieldValue}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
            <div className="flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
                {t.common.cancel}
              </Button>
              <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto">
                {t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
