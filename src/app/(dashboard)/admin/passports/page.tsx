"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Award, Download } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

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

type EventOption = {
  id: string
  name: string
}

export default function AdminPassportsPage() {
  const { t, locale } = useI18n()
  const [events, setEvents] = useState<EventOption[]>([])
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

  const downloadPdf = async (passportId: string, downloadLocale: "ru" | "en" = locale as "ru" | "en") => {
    try {
      const response = await fetch(`/api/passports/${passportId}/pdf?lang=${downloadLocale}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `skill-passport-${passportId}-${downloadLocale}.pdf`
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.passportsAdmin.title}</h1>
          <p className="text-gray-500 mt-1">{t.passportsAdmin.subtitle}</p>
        </div>
        {passports.length > 0 && (
          <Button onClick={downloadAllPdfs} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            {t.passportsAdmin.downloadAll}
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.nav.events}
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">{t.passportsAdmin.selectEvent}</option>
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
            {t.passportsAdmin.selectEventToView}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t.passportsAdmin.noPassports}</h3>
            <p className="text-gray-500">
              {t.passportsAdmin.noPassportsHint}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {passports.map((passport) => (
              <Card key={passport.id}>
                <CardContent className="space-y-4 p-4">
                  <div>
                    <p className="font-medium">{passport.user.lastName} {passport.user.firstName}</p>
                    <p className="break-all text-sm text-gray-500">{passport.user.email}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.teams.title}</p>
                      <p className="mt-1 text-sm text-gray-600">{passport.team?.name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{t.scoring.score}</p>
                      <p className="mt-1 text-lg font-bold text-red-600">{passport.totalScore.toFixed(1)}<span className="ml-1 text-sm font-normal text-gray-400">/100</span></p>
                    </div>
                  </div>
                  <div>
                    {passport.publishedAt ? (
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">{t.passportsAdmin.published}</span>
                    ) : (
                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">{t.passportsAdmin.draft}</span>
                    )}
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => downloadPdf(passport.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white md:block">
            <table className="w-full min-w-[760px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.applications.participant}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.teams.title}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t.scoring.score}
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
                        {t.passportsAdmin.published}
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-full text-xs">
                        {t.passportsAdmin.draft}
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
        </>
      )}
    </div>
  )
}
