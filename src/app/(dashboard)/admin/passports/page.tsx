"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Award, Download, Send } from "lucide-react"

interface Passport {
  id: string
  totalScore: number
  publishedAt: string | null
  user: {
    firstName: string
    lastName: string
    email: string
    organization: string | null
  }
  event: {
    name: string
    competency: string
  }
  team: {
    name: string
  } | null
}

export default function AdminPassportsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [passports, setPassports] = useState<Passport[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchPassports()
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

  const fetchPassports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/passports`)
      if (response.ok) {
        const data = await response.json()
        setPassports(data)
      }
    } catch (error) {
      console.error("Error fetching passports:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const downloadPdf = async (passportId: string) => {
    try {
      const response = await fetch(`/api/passports/${passportId}/pdf`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `skill-passport-${passportId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Error downloading PDF:", error)
    }
  }

  const downloadAllPdfs = async () => {
    for (const passport of passports) {
      await downloadPdf(passport.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skill Passports</h1>
          <p className="text-gray-500 mt-1">Управление паспортами компетенций</p>
        </div>
        {passports.length > 0 && (
          <Button onClick={downloadAllPdfs}>
            <Download className="h-4 w-4 mr-2" />
            Скачать все PDF
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Мероприятие
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Выберите мероприятие</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Выберите мероприятие для просмотра паспортов
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : passports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Нет паспортов</h3>
            <p className="text-gray-500">
              Паспорта появятся после публикации результатов мероприятия
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Участник
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Команда
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Балл
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Статус
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {passports.map((passport) => (
                <tr key={passport.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">
                        {passport.user.lastName} {passport.user.firstName}
                      </p>
                      <p className="text-sm text-gray-500">{passport.user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {passport.team?.name || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-lg font-bold text-red-600">
                      {passport.totalScore.toFixed(1)}
                    </span>
                    <span className="text-gray-400">/100</span>
                  </td>
                  <td className="px-6 py-4">
                    {passport.publishedAt ? (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                        Опубликован
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        Черновик
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadPdf(passport.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
