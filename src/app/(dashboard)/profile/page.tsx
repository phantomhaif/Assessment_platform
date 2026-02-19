"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Camera, Trash2 } from "lucide-react"
import { signOut } from "next-auth/react"
import { useI18n } from "@/lib/i18n/context"

interface ProfileField {
  id: string
  name: string
  nameEn: string | null
  type: "TEXT" | "TEXTAREA" | "SELECT" | "DATE"
  required: boolean
  options: string[]
  optionsEn: string[]
  order: number
}

interface UserProfile {
  firstName: string
  lastName: string
  middleName: string
  email: string
  organization: string
  position: string
  phone: string
  photo: string | null
  customFields?: Record<string, string>
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { t, locale } = useI18n()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [isDeleting, setIsDeleting] = useState(false)
  const [profileFields, setProfileFields] = useState<ProfileField[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "",
    lastName: "",
    middleName: "",
    email: "",
    organization: "",
    position: "",
    phone: "",
    photo: null,
  })

  useEffect(() => {
    fetchProfile()
    fetchProfileFields()
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        if (data.customFields) {
          setCustomFieldValues(data.customFields)
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
    }
  }

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setMessage({ type: "", text: "" })

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          customFields: customFieldValues,
        }),
      })

      if (response.ok) {
        setMessage({ type: "success", text: t.profile.profileUpdated })
        await update()
      } else {
        throw new Error(t.profile.saveError)
      }
    } catch (error) {
      setMessage({ type: "error", text: t.profile.profileUpdateError })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)
    formData.append("type", "avatar")

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const { url } = await response.json()
        setProfile(prev => ({ ...prev, photo: url }))
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t.profile.confirmDelete)
    if (!confirmed) return

    const doubleConfirm = window.confirm(t.profile.confirmDeleteFinal)
    if (!doubleConfirm) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await signOut({ callbackUrl: "/login" })
      } else {
        throw new Error("Failed to delete account")
      }
    } catch (error) {
      setMessage({ type: "error", text: t.profile.deleteError })
      setIsDeleting(false)
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.profile.title}</h1>
        <p className="text-gray-500 mt-1">{t.profile.subtitle}</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t.profile.personalInfo}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Фото */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                  {profile.photo ? (
                    <img
                      src={profile.photo}
                      alt={t.profile.profilePhoto}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-400">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1 bg-red-600 rounded-full cursor-pointer hover:bg-red-700 transition-colors">
                  <Camera className="h-4 w-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <div>
                <p className="font-medium text-gray-900">{t.profile.profilePhoto}</p>
                <p className="text-sm text-gray-500">{t.profile.photoHint}</p>
              </div>
            </div>

            {/* Основные данные */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t.profile.lastName}
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label={t.profile.firstName}
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label={t.profile.middleName}
                name="middleName"
                value={profile.middleName || ""}
                onChange={handleChange}
              />
              <Input
                label={t.common.email}
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled
              />
              <Input
                label={t.common.organization}
                name="organization"
                value={profile.organization || ""}
                onChange={handleChange}
                placeholder={t.profile.organizationPlaceholder}
              />
              <Input
                label={t.common.position}
                name="position"
                value={profile.position || ""}
                onChange={handleChange}
                placeholder={t.profile.positionPlaceholder}
              />
              <Input
                label={t.common.phone}
                name="phone"
                type="tel"
                value={profile.phone || ""}
                onChange={handleChange}
                placeholder={t.profile.phonePlaceholder}
              />
            </div>

            {/* Custom Fields */}
            {profileFields.length > 0 && (
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-700 mb-4">
                  {locale === "ru" ? "Дополнительная информация" : "Additional Information"}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileFields.map((field) => {
                    const fieldLabel = (locale === "ru" ? field.name : field.nameEn || field.name) + (field.required ? " *" : "")
                    const value = customFieldValues[field.id] || ""

                    if (field.type === "SELECT") {
                      // Use EN options when locale is EN (value is always stored in RU)
                      const displayOptions = field.options.map((opt, i) => ({
                        value: opt,
                        label: locale === "en" && field.optionsEn?.[i] ? field.optionsEn[i] : opt,
                      }))
                      return (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {fieldLabel}
                          </label>
                          <select
                            value={value}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required={field.required}
                          >
                            <option value="">{locale === "ru" ? "Выберите..." : "Select..."}</option>
                            {displayOptions.map((opt, i) => (
                              <option key={i} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </div>
                      )
                    }

                    if (field.type === "TEXTAREA") {
                      return (
                        <div key={field.id} className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {fieldLabel}
                          </label>
                          <textarea
                            value={value}
                            onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                            className="w-full min-h-[80px] rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                            required={field.required}
                          />
                        </div>
                      )
                    }

                    return (
                      <Input
                        key={field.id}
                        label={fieldLabel}
                        type={field.type === "DATE" ? "date" : "text"}
                        value={value}
                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                        required={field.required}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSaving}>
                {t.profile.saveChanges}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">{t.profile.dangerZone}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{t.profile.deleteWarning}</p>
          <Button
            variant="outline"
            className="text-red-600 border-red-300 hover:bg-red-50"
            onClick={handleDeleteAccount}
            isLoading={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t.profile.deleteAccount}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
