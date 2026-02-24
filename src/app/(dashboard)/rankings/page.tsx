"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Trophy, Medal, Award, Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"

interface Ranking {
  rank: number
  name: string
  totalScore: number
  eventsCount?: number
  teams?: any[]
  id?: string
  number?: number
  eventName?: string
  eventDate?: string
}

export default function RankingsPage() {
  const [period, setPeriod] = useState<"all" | "year" | "event">("all")
  const [eventId, setEventId] = useState<string>("")
  const [events, setEvents] = useState<any[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    fetchRankings()
  }, [period, eventId])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data.filter((e: any) => e.status === "RESULTS_PUBLISHED" || e.status === "ARCHIVED"))
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchRankings = async () => {
    setIsLoading(true)
    try {
      let url = `/api/rankings?period=${period}`
      if (period === "event" && eventId) {
        url += `&eventId=${eventId}`
      }
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRankings(data)
      }
    } catch (error) {
      console.error("Error fetching rankings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />
    return <Award className="h-6 w-6 text-gray-300" />
  }

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200"
    if (rank === 2) return "bg-gray-50 border-gray-200"
    if (rank === 3) return "bg-orange-50 border-orange-200"
    return "bg-white"
  }

  if (isLoading && rankings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Trophy className="h-7 w-7 text-red-600" />
          {locale === "ru" ? "Рейтинг команд" : "Team Rankings"}
        </h1>
        <p className="text-gray-500 mt-1">
          {locale === "ru"
            ? "Рейтинг лучших команд по результатам соревнований"
            : "Top teams by competition results"}
        </p>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {locale === "ru" ? "Период" : "Period"}
              </label>
              <select
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value as any)
                  if (e.target.value !== "event") setEventId("")
                }}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">{locale === "ru" ? "Все мероприятия" : "All events"}</option>
                <option value="year">{locale === "ru" ? "За текущий год" : "Current year"}</option>
                <option value="event">{locale === "ru" ? "Конкретное мероприятие" : "Specific event"}</option>
              </select>
            </div>
            {period === "event" && (
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.nav.events}
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">{locale === "ru" ? "Выберите мероприятие..." : "Select event..."}</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rankings */}
      {period === "event" && !eventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Выберите мероприятие" : "Select an event"}
          </CardContent>
        </Card>
      ) : rankings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Нет данных для отображения" : "No data available"}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {locale === "ru" ? "Таблица рейтинга" : "Rankings Table"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.map((ranking, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border rounded-lg transition-colors hover:shadow-md ${getMedalColor(ranking.rank)}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-12">
                      {getMedalIcon(ranking.rank)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-bold text-gray-400 w-8">
                          #{ranking.rank}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {ranking.name}
                            {ranking.number && ` #${ranking.number}`}
                          </p>
                          {period === "event" && ranking.eventName && (
                            <p className="text-sm text-gray-500">{ranking.eventName}</p>
                          )}
                          {period !== "event" && ranking.eventsCount && (
                            <p className="text-sm text-gray-500">
                              {ranking.eventsCount} {locale === "ru"
                                ? (ranking.eventsCount === 1 ? "мероприятие" : "мероприятий")
                                : (ranking.eventsCount === 1 ? "event" : "events")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">
                      {ranking.totalScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {locale === "ru" ? "баллов" : "points"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
