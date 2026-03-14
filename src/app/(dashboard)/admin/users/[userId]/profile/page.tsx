"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, User, Mail, Phone, Building, Briefcase, Award } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

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
    }
    value: string
  }[]
  _count: {
    applications: number
    skillPassports: number
  }
}

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
        <Link href="/admin/users" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            {t.common.edit}
          </Button>
        </Link>
      </div>

      {/* Main Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {locale === "ru" ? "Основная информация" : "Basic Information"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                <Mail className="inline h-4 w-4 mr-1" />
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Phone className="inline h-4 w-4 mr-1" />
                  {t.common.phone}
                </label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
            )}
            {user.organization && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Building className="inline h-4 w-4 mr-1" />
                  {t.common.organization}
                </label>
                <p className="text-gray-900">{user.organization}</p>
              </div>
            )}
            {user.position && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  <Briefcase className="inline h-4 w-4 mr-1" />
                  {t.common.position}
                </label>
                <p className="text-gray-900">{user.position}</p>
              </div>
            )}
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
                  <p className="text-gray-900">{cfv.value}</p>
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
