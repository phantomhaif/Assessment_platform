"use client"

import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, Users, Award, ClipboardList } from "lucide-react"

export default function DashboardPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"
  const isExpert = session?.user?.role === "EXPERT"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Панель управления</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin && "Управление мероприятиями и оценивание"}
          {isExpert && "Оценивание команд"}
          {!isAdmin && !isExpert && "Ваши мероприятия и результаты"}
        </p>
      </div>

      {/* Статистика для админа */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Мероприятия</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Участники</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Команды</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Паспортов выдано</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Контент для участника */}
      {!isAdmin && !isExpert && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Мои заявки</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">У вас пока нет активных заявок</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Мои результаты</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">Результаты появятся после участия в мероприятиях</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Контент для эксперта */}
      {isExpert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Назначенные оценки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">Нет назначенных команд для оценивания</p>
          </CardContent>
        </Card>
      )}

      {/* Ближайшие мероприятия */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ближайшие мероприятия</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Нет запланированных мероприятий</p>
        </CardContent>
      </Card>
    </div>
  )
}
