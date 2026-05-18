"use client"

import { ChangeEvent, useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, User, Mail, Phone, Building, Briefcase, Award, Camera, Pencil, Save, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { PhotoCropModal } from "@/components/ui/photo-crop-modal"

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  middleName?: string | null
  organization?: string | null
  position?: string | null
  phone?: string | null
  role: string
  photo?: string | null
  customFieldValues: {
    field: {
      id: string
      name: string
      nameEn: string
      type: string
      options?: string[]
      optionsEn?: string[]
    }
    value: string
  }[]
  _count: {
    applications: number
    skillPassports: number
  }
}

interface UserProfileForm {
  firstName: string
  lastName: string
  middleName: string
  organization: string
  position: string
  phone: string
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [form, setForm] = useState<UserProfileForm>({
    firstName: "",
    lastName: "",
    middleName: "",
    organization: "",
    position: "",
    phone: "",
  })
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [message, setMessage] = useState("")
  const [cropFile, setCropFile] = useState<File | null>(null)
  const { t, locale } = useI18n()

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setUser(data)
        setForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          middleName: data.middleName || "",
          organization: data.organization || "",
          position: data.position || "",
          phone: data.phone || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: Record<string, string> = {
      ADMIN: t.roles.admin,
      ORGANIZER: t.roles.organizer,
      EXPERT: t.roles.expert,
      PARTICIPANT: t.roles.participant,
    }
    return roleLabels[role] || role
  }

  const getCustomFieldValue = (cfv: UserProfile["customFieldValues"][number]) => {
    if (locale !== "en" || !cfv.field.options?.length || !cfv.field.optionsEn?.length) {
      return cfv.value
    }

    const optionIndex = cfv.field.options.findIndex(option => option === cfv.value)
    return optionIndex >= 0 ? cfv.field.optionsEn[optionIndex] || cfv.value : cfv.value
  }

  const profileLabels = {
    lastName: locale === "ru" ? "Фамилия" : "Last Name",
    firstName: locale === "ru" ? "Имя" : "First Name",
    middleName: locale === "ru" ? "Отчество" : "Middle Name",
  }

  const updateForm = (field: keyof UserProfileForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const saveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          middleName: form.middleName || null,
          organization: form.organization || null,
          position: form.position || null,
          phone: form.phone || null,
        }),
      })

      if (!response.ok) {
        throw new Error("Save failed")
      }

      const updated = await response.json()
      setUser(prev => prev ? { ...prev, ...updated } : updated)
      setIsEditing(false)
      setMessage(locale === "ru" ? "Профиль сохранён" : "Profile saved")
    } catch {
      setMessage(locale === "ru" ? "Не удалось сохранить профиль" : "Failed to save profile")
    } finally {
      setIsSaving(false)
    }
  }

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.currentTarget.value = ""
    if (!user || !file) return
    setCropFile(file)
  }

  const uploadPhoto = async (file: File) => {
    if (!user) return
    setCropFile(null)
    setIsUploadingPhoto(true)
    setMessage("")

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "avatar")
      formData.append("userId", user.id)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || "Upload failed")
      }

      setUser(prev => prev ? { ...prev, photo: payload.url } : prev)
      setMessage(locale === "ru" ? "Фото обновлено" : "Photo updated")
    } catch {
      setMessage(locale === "ru" ? "Не удалось обновить фото" : "Failed to update photo")
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "ru" ? "Пользователь не найден" : "User not found"}
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PhotoCropModal
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onCropped={uploadPhoto}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user.lastName} {user.firstName} {user.middleName}
            </h1>
            <p className="text-gray-500 mt-1">
              {getRoleLabel(user.role)}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {isEditing ? (
            <>
              <Button onClick={saveProfile} isLoading={isSaving} className="w-full sm:w-auto">
                <Save className="mr-2 h-4 w-4" />
                {t.common.save}
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)} className="w-full sm:w-auto">
                <X className="mr-2 h-4 w-4" />
                {locale === "ru" ? "Отмена" : "Cancel"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="w-full sm:w-auto">
              <Pencil className="mr-2 h-4 w-4" />
              {t.common.edit}
            </Button>
          )}
        </div>
      </div>

      {message && (
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      {/* Main Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {locale === "ru" ? "Основная информация" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[160px_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-500">
                {locale === "ru" ? "Фото участника" : "Participant photo"}
              </p>
              {user.photo ? (
                <div className="space-y-3">
                  <a href={user.photo} target="_blank" rel="noopener noreferrer">
                    <img src={user.photo} alt="" className="aspect-[3/4] w-36 rounded-xl border border-gray-200 object-cover" />
                  </a>
                  <a href={user.photo} target="_blank" rel="noopener noreferrer" className="block text-sm text-[#C41E3A] hover:underline">
                    {locale === "ru" ? "Скачать оригинал" : "Download original"}
                  </a>
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500">
                  {locale === "ru" ? "Фото не загружено" : "No photo uploaded"}
                </div>
              )}
              <input
                id="admin-user-photo"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={selectPhoto}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isUploadingPhoto}
                onClick={() => document.getElementById("admin-user-photo")?.click()}
                className="mt-3 w-36"
              >
                <Camera className="mr-2 h-4 w-4" />
                {locale === "ru" ? "Заменить" : "Replace"}
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {([
              ["lastName", profileLabels.lastName, User],
              ["firstName", profileLabels.firstName, User],
              ["middleName", profileLabels.middleName, User],
              ["phone", t.common.phone, Phone],
              ["organization", t.common.organization, Building],
              ["position", t.common.position, Briefcase],
            ] as const).map(([field, label, Icon]) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Icon className="inline h-4 w-4 mr-1" />
                  {label}
                </label>
                {isEditing ? (
                  <input
                    value={form[field]}
                    onChange={(event) => updateForm(field, event.target.value)}
                    className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                ) : (
                  <p className="text-gray-900">{user[field] || "—"}</p>
                )}
              </div>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Fields */}
      {user.customFieldValues && user.customFieldValues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {locale === "ru" ? "Дополнительная информация" : "Additional Information"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {user.customFieldValues.map((cfv) => (
                <div key={cfv.field.id}>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    {locale === "ru" ? cfv.field.name : cfv.field.nameEn}
                  </label>
                  <p className="text-gray-900">{getCustomFieldValue(cfv)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            {locale === "ru" ? "Статистика" : "Statistics"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{user._count.applications}</p>
              <p className="text-sm text-gray-600 mt-1">{t.admin.applications}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold text-red-600">{user._count.skillPassports}</p>
              <p className="text-sm text-gray-600 mt-1">{t.admin.passportsCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
