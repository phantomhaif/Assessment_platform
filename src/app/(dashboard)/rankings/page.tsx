"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Medal, Award } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Ranking {
  rank: number
  name: string
  totalScore: number
  eventsCount?: number
  id?: string
  number?: number | null
  eventName?: string
}

interface EventOption {
  id: string
  name: string
  status: string
}

export default function RankingsPage() {
  const [period, setPeriod] = useState<"all" | "year" | "event">("all")
  const [eventId, setEventId] = useState("")
  const [events, setEvents] = useState<EventOption[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { locale } = useI18n()

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events")
        if (!response.ok) return

        const data = await response.json()
        setEvents(data.filter((event: EventOption) => ["RESULTS_PUBLISHED", "ARCHIVED"].includes(event.status)))
      } catch (error) {
        console.error("Error fetching events:", error)
      }
    }

    void fetchEvents()
  }, [])

  useEffect(() => {
    const fetchRankings = async () => {
      setIsLoading(true)
      try {
        let url = `/api/rankings?period=${period}`
        if (period === "event" && eventId) {
          url += `&eventId=${eventId}`
        }

        const response = await fetch(url)
        if (!response.ok) return

        const data = await response.json()
        setRankings(data)
      } catch (error) {
        console.error("Error fetching rankings:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRankings()
  }, [period, eventId])

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />
    if (rank === 3) return <Medal className="h-6 w-6 text-orange-600" />
    return <Award className="h-6 w-6 text-gray-300" />
  }

  const getMedalColor = (rank: number) => {
    if (rank === 1) return "border-yellow-200 bg-yellow-50"
    if (rank === 2) return "border-gray-200 bg-gray-50"
    if (rank === 3) return "border-orange-200 bg-orange-50"
    return "bg-white"
  }

  if (isLoading && rankings.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <Trophy className="h-7 w-7 text-red-600" />
          {locale === "ru" ? "Рейтинг команд" : "Team Rankings"}
        </h1>
        <p className="mt-1 text-gray-500">
          {locale === "ru"
            ? "Общий зачёт по сумме баллов команд с одинаковым названием."
            : "Aggregate standings by total score for teams with the same name."}
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {locale === "ru" ? "Период" : "Period"}
              </label>
              <select
                value={period}
                onChange={(event) => {
                  setPeriod(event.target.value as "all" | "year" | "event")
                  if (event.target.value !== "event") {
                    setEventId("")
                  }
                }}
                className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="all">{locale === "ru" ? "Все время" : "All time"}</option>
                <option value="year">{locale === "ru" ? "За последний год" : "Last 12 months"}</option>
                <option value="event">{locale === "ru" ? "Конкретный чемпионат" : "Specific event"}</option>
              </select>
            </div>

            {period === "event" && (
              <div className="flex-1">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {locale === "ru" ? "Чемпионат" : "Event"}
                </label>
                <select
                  value={eventId}
                  onChange={(event) => setEventId(event.target.value)}
                  className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
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

      {period === "event" && !eventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Выберите чемпионат" : "Select an event"}
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
                  key={`${ranking.id || ranking.name}-${index}`}
                  className={`flex flex-col gap-4 rounded-lg border p-4 transition-colors hover:shadow-md sm:flex-row sm:items-center sm:justify-between ${getMedalColor(ranking.rank)}`}
                >
                  <div className="flex flex-1 items-start gap-4">
                    <div className="flex w-12 items-center justify-center">
                      {getMedalIcon(ranking.rank)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <span className="w-8 text-2xl font-bold text-gray-400">#{ranking.rank}</span>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">
                            {ranking.name}
                            {ranking.number ? ` #${ranking.number}` : ""}
                          </p>
                          {period === "event" && ranking.eventName && (
                            <p className="text-sm text-gray-500">{ranking.eventName}</p>
                          )}
                          {period !== "event" && ranking.eventsCount && (
                            <p className="text-sm text-gray-500">
                              {ranking.eventsCount}{" "}
                              {locale === "ru"
                                ? ranking.eventsCount === 1
                                  ? "чемпионат"
                                  : "чемпионатов"
                                : ranking.eventsCount === 1
                                  ? "event"
                                  : "events"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-2xl font-bold text-red-600">{ranking.totalScore.toFixed(1)}</p>
                    <p className="text-xs text-gray-500">{locale === "ru" ? "баллов" : "points"}</p>
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
