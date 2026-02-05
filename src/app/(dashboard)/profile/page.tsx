"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Camera } from "lucide-react"

interface UserProfile {
  firstName: string
  lastName: string
  middleName: string
  email: string
  organization: string
  position: string
  phone: string
  photo: string | null
}

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })

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
  }, [])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/profile")
      if (response.ok) {
        const data = await response.json()
        setProfile(data)
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setIsLoading(false)
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
        body: JSON.stringify(profile),
      })

      if (response.ok) {
        setMessage({ type: "success", text: "Профиль успешно обновлён" })
        await update()
      } else {
        throw new Error("Ошибка сохранения")
      }
    } catch (error) {
      setMessage({ type: "error", text: "Ошибка при сохранении профиля" })
    } finally {
      setIsSaving(false)
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Профиль</h1>
        <p className="text-gray-500 mt-1">Управление личными данными</p>
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
          <CardTitle>Личные данные</CardTitle>
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
                      alt="Фото профиля"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl text-gray-400">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1 bg-blue-600 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
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
                <p className="font-medium text-gray-900">Фото профиля</p>
                <p className="text-sm text-gray-500">JPG или PNG, до 5 МБ</p>
              </div>
            </div>

            {/* Основные данные */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Фамилия"
                name="lastName"
                value={profile.lastName}
                onChange={handleChange}
                required
              />
              <Input
                label="Имя"
                name="firstName"
                value={profile.firstName}
                onChange={handleChange}
                required
              />
              <Input
                label="Отчество"
                name="middleName"
                value={profile.middleName}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleChange}
                disabled
              />
              <Input
                label="Организация"
                name="organization"
                value={profile.organization}
                onChange={handleChange}
                placeholder="МИРЭА — Российский технологический университет"
              />
              <Input
                label="Должность"
                name="position"
                value={profile.position}
                onChange={handleChange}
                placeholder="Студент / Преподаватель"
              />
              <Input
                label="Телефон"
                name="phone"
                type="tel"
                value={profile.phone}
                onChange={handleChange}
                placeholder="+7 (999) 123-45-67"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" isLoading={isSaving}>
                Сохранить изменения
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
