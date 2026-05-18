"use client"

import { useEffect, useMemo, useState } from "react"
import { Award, Medal, Minus, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { getLocalizedCompetency, getLocalizedEventName } from "@/lib/events"

type RankingView = "teams" | "universities" | "participants" | "live"
type RankingPeriod = "all" | "year" | "event"

interface Ranking {
  rank: number
  name: string
  totalScore: number
  eventsCount?: number
  teamsCount?: number
  participantsCount?: number
  competenciesCount?: number
  organization?: string | null
  id?: string
  number?: number | null
  eventName?: string
  previousRank?: number | null
  trend?: "up" | "down" | "same" | "new"
}

interface EventOption {
  id: string
  name: string
  nameEn?: string | null
  competency: string
  competencyEn?: string | null
  status: string
  eventStart: string
  eventEnd: string
}

interface CompetencyOption {
  key: string
  label: string
}

interface LivePayload {
  rankings: Ranking[]
  days: string[]
  selectedDay: string | null
}

const RESULT_STATUSES = new Set(["RESULTS_PUBLISHED", "ARCHIVED"])
const LIVE_STATUSES = new Set(["IN_PROGRESS", "SCORING", "RESULTS_PUBLISHED", "ARCHIVED"])

export default function RankingsPage() {
  const { locale } = useI18n()
  const [view, setView] = useState<RankingView>("teams")
  const [period, setPeriod] = useState<RankingPeriod>("all")
  const [competency, setCompetency] = useState("")
  const [eventId, setEventId] = useState("")
  const [liveDay, setLiveDay] = useState("")
  const [events, setEvents] = useState<EventOption[]>([])
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [liveDays, setLiveDays] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/events")
        if (!response.ok) {
          setIsLoading(false)
          return
        }

        const data = (await response.json()) as EventOption[]
        setEvents(data)

        const firstPublished = data.find((event) => RESULT_STATUSES.has(event.status))
        const firstLive = data.find((event) => LIVE_STATUSES.has(event.status))

        if (firstPublished) {
          setCompetency(firstPublished.competency)
        }
        if (firstLive) {
          setEventId(firstLive.id)
        }
      } catch (error) {
        console.error("Error fetching events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchEvents()
  }, [])

  const publishedEvents = useMemo(() => events.filter((event) => RESULT_STATUSES.has(event.status)), [events])
  const liveEvents = useMemo(() => events.filter((event) => LIVE_STATUSES.has(event.status)), [events])

  const competencyOptions = publishedEvents.reduce<CompetencyOption[]>((items, event) => {
    if (!items.some((item) => item.key === event.competency)) {
      items.push({
        key: event.competency,
        label: getLocalizedCompetency(event, locale),
      })
    }
    return items
  }, [])

  const competencyEvents = publishedEvents.filter((event) => event.competency === competency)

  useEffect(() => {
    if (view !== "teams" || period !== "event") {
      return
    }

    if (!competencyEvents.some((event) => event.id === eventId)) {
      setEventId(competencyEvents[0]?.id || "")
    }
  }, [view, period, competencyEvents, eventId])

  useEffect(() => {
    if (view !== "live") {
      return
    }

    if (!liveEvents.some((event) => event.id === eventId)) {
      setEventId(liveEvents[0]?.id || "")
      setLiveDay("")
    }
  }, [view, liveEvents, eventId])

  useEffect(() => {
    const fetchRankings = async () => {
      if (view === "teams" && !competency) {
        setRankings([])
        return
      }

      if ((view === "teams" && period === "event" && !eventId) || (view === "live" && !eventId)) {
        setRankings([])
        return
      }

      setIsLoading(true)

      try {
        const params = new URLSearchParams({
          view,
          period,
          lang: locale,
        })

        if (view === "teams") {
          params.set("competency", competency)
          if (period === "event") params.set("eventId", eventId)
        }

        if (view === "live") {
          params.set("eventId", eventId)
          if (liveDay) params.set("day", liveDay)
        }

        const response = await fetch(`/api/rankings?${params.toString()}`)
        if (!response.ok) {
          setRankings([])
          return
        }

        const data = await response.json()
        if (view === "live") {
          const payload = data as LivePayload
          setRankings(payload.rankings || [])
          setLiveDays(payload.days || [])
          if (payload.selectedDay && payload.selectedDay !== liveDay) {
            setLiveDay(payload.selectedDay)
          }
        } else {
          setRankings(data as Ranking[])
          setLiveDays([])
        }
      } catch (error) {
        console.error("Error fetching rankings:", error)
        setRankings([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchRankings()
  }, [view, period, competency, eventId, liveDay, locale])

  const selectedCompetencyLabel =
    competencyOptions.find((option) => option.key === competency)?.label ||
    (locale === "ru" ? "Компетенция" : "Competency")

  const selectedEvent = events.find((event) => event.id === eventId)
  const title = getViewTitle(view, locale)
  const subtitle = getViewSubtitle(view, locale)

  return (
    <div className="space-y-6">
      <div className="ph">
        <div className="ph-tag">rankings</div>
        <h1 className="ph-title flex items-center gap-2">
          <Trophy className="h-7 w-7 text-red-600" />
          {title}
        </h1>
        <p className="ph-sub">{subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                ["teams", locale === "ru" ? "Команды" : "Teams"],
                ["universities", locale === "ru" ? "Университеты" : "Universities"],
                ["participants", locale === "ru" ? "Участники" : "Participants"],
                ["live", locale === "ru" ? "По дням мероприятия" : "Event days"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setView(key as RankingView)
                    if (key === "live") {
                      setPeriod("all")
                    }
                  }}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
                    view === key
                      ? "border-red-500 bg-red-600 text-white"
                      : "border-white/10 bg-white/[0.04] text-gray-300 hover:border-red-500/60"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {view === "teams" && (
                <FilterSelect
                  label={locale === "ru" ? "Компетенция" : "Competency"}
                  value={competency}
                  onChange={(value) => {
                    setCompetency(value)
                    if (period === "event") setEventId("")
                  }}
                  options={competencyOptions.map((option) => ({ value: option.key, label: option.label }))}
                />
              )}

              {view !== "live" && (
                <FilterSelect
                  label={locale === "ru" ? "Период" : "Period"}
                  value={period}
                  onChange={(value) => {
                    setPeriod(value as RankingPeriod)
                    if (value !== "event" && view === "teams") setEventId("")
                  }}
                  options={[
                    { value: "all", label: locale === "ru" ? "Все время" : "All time" },
                    { value: "year", label: locale === "ru" ? "Последние 12 месяцев" : "Last 12 months" },
                    ...(view === "teams"
                      ? [{ value: "event", label: locale === "ru" ? "Конкретное мероприятие" : "Specific event" }]
                      : []),
                  ]}
                />
              )}

              {view === "teams" && period === "event" && (
                <FilterSelect
                  label={locale === "ru" ? "Мероприятие" : "Event"}
                  value={eventId}
                  onChange={setEventId}
                  options={competencyEvents.map((event) => ({
                    value: event.id,
                    label: getLocalizedEventName(event, locale),
                  }))}
                />
              )}

              {view === "live" && (
                <>
                  <FilterSelect
                    label={locale === "ru" ? "Мероприятие" : "Event"}
                    value={eventId}
                    onChange={(value) => {
                      setEventId(value)
                      setLiveDay("")
                    }}
                    options={liveEvents.map((event) => ({
                      value: event.id,
                      label: getLocalizedEventName(event, locale),
                    }))}
                  />
                  <FilterSelect
                    label={locale === "ru" ? "День" : "Day"}
                    value={liveDay}
                    onChange={setLiveDay}
                    options={liveDays.map((day, index) => ({
                      value: day,
                      label: `${locale === "ru" ? "День" : "Day"} ${index + 1}: ${day}`,
                    }))}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && rankings.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
        </div>
      ) : rankings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Нет данных для отображения." : "No data available."}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {view === "participants" ? <Users className="h-5 w-5" /> : <Trophy className="h-5 w-5" />}
              {view === "teams"
                ? selectedCompetencyLabel
                : view === "live" && selectedEvent
                  ? getLocalizedEventName(selectedEvent, locale)
                  : title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rankings.map((ranking, index) => (
                <RankingRow key={`${ranking.id || ranking.name}-${index}`} ranking={ranking} view={view} locale={locale} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
      >
        {options.length === 0 ? (
          <option value="">-</option>
        ) : (
          options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))
        )}
      </select>
    </label>
  )
}

function RankingRow({ ranking, view, locale }: { ranking: Ranking; view: RankingView; locale: "ru" | "en" }) {
  return (
    <div className={`flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${getMedalColor(ranking.rank)}`}>
      <div className="flex flex-1 items-start gap-4">
        <div className="flex w-12 items-center justify-center">{getMedalIcon(ranking.rank)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <span className="w-10 shrink-0 text-2xl font-bold text-[#dce4f0]">#{ranking.rank}</span>
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-[#f5f7fb]">
                {ranking.name}
                {ranking.number ? ` #${ranking.number}` : ""}
              </p>
              <p className="mt-1 text-sm text-gray-500">{getMetaLine(ranking, view, locale)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:min-w-[160px] sm:justify-end">
        {view === "live" && <TrendBadge ranking={ranking} locale={locale} />}
        <div className="text-left sm:text-right">
          <p className="text-2xl font-bold text-red-500">{ranking.totalScore.toFixed(1)}</p>
          <p className="text-xs text-gray-500">{locale === "ru" ? "баллов" : "points"}</p>
        </div>
      </div>
    </div>
  )
}

function TrendBadge({ ranking, locale }: { ranking: Ranking; locale: "ru" | "en" }) {
  if (ranking.trend === "up") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2 py-1 text-xs font-semibold text-green-600">
        <TrendingUp className="h-4 w-4" />
        {locale === "ru" ? `+${(ranking.previousRank || ranking.rank) - ranking.rank}` : "Up"}
      </span>
    )
  }

  if (ranking.trend === "down") {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-semibold text-red-500">
        <TrendingDown className="h-4 w-4" />
        {locale === "ru" ? `-${ranking.rank - (ranking.previousRank || ranking.rank)}` : "Down"}
      </span>
    )
  }

  if (ranking.trend === "new") {
    return <span className="rounded-md bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-500">{locale === "ru" ? "новый" : "new"}</span>
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-gray-400">
      <Minus className="h-4 w-4" />
      {locale === "ru" ? "без изменений" : "same"}
    </span>
  )
}

function getMetaLine(ranking: Ranking, view: RankingView, locale: "ru" | "en") {
  const parts: string[] = []

  if (ranking.eventName) parts.push(ranking.eventName)
  if (ranking.organization) parts.push(ranking.organization)
  if (ranking.eventsCount) parts.push(`${ranking.eventsCount} ${locale === "ru" ? "меропр." : "events"}`)
  if (ranking.teamsCount) parts.push(`${ranking.teamsCount} ${locale === "ru" ? "команд" : "teams"}`)
  if (ranking.participantsCount) parts.push(`${ranking.participantsCount} ${locale === "ru" ? "участн." : "participants"}`)
  if (ranking.competenciesCount) parts.push(`${ranking.competenciesCount} ${locale === "ru" ? "компет." : "competencies"}`)
  if (view === "live" && ranking.previousRank) parts.push(`${locale === "ru" ? "вчера" : "previous"} #${ranking.previousRank}`)

  return parts.length > 0 ? parts.join(" · ") : locale === "ru" ? "Сводный результат" : "Aggregated result"
}

function getMedalIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
  if (rank === 2) return <Medal className="h-6 w-6 text-sky-300" />
  if (rank === 3) return <Medal className="h-6 w-6 text-orange-500" />
  return <Award className="h-6 w-6 text-gray-400" />
}

function getMedalColor(rank: number) {
  if (rank === 1) return "border-yellow-500/30 bg-[#100e0f] shadow-[inset_3px_0_0_0_rgba(234,179,8,0.35)]"
  if (rank === 2) return "border-sky-500/25 bg-[#0c1420] shadow-[inset_3px_0_0_0_rgba(96,165,250,0.30)]"
  if (rank === 3) return "border-orange-500/25 bg-[#120d0a] shadow-[inset_3px_0_0_0_rgba(249,115,22,0.30)]"
  return "border-white/10 bg-[#0b0e16]"
}

function getViewTitle(view: RankingView, locale: "ru" | "en") {
  if (view === "universities") return locale === "ru" ? "Сводный рейтинг университетов" : "Overall University Ranking"
  if (view === "participants") return locale === "ru" ? "Рейтинг участников" : "Participant Ranking"
  if (view === "live") return locale === "ru" ? "Рейтинг по дням мероприятия" : "Event Day Ranking"
  return locale === "ru" ? "Рейтинг команд по компетенциям" : "Team Rankings by Competency"
}

function getViewSubtitle(view: RankingView, locale: "ru" | "en") {
  if (view === "universities") {
    return locale === "ru"
      ? "Суммарный рейтинг организаций по всем компетенциям и опубликованным чемпионатам."
      : "Aggregated organization ranking across all competencies and published events."
  }

  if (view === "participants") {
    return locale === "ru"
      ? "Сводный рейтинг участников по опубликованным skill passport результатам."
      : "Aggregated participant ranking based on published skill passport results."
  }

  if (view === "live") {
    return locale === "ru"
      ? "Текущий рейтинг команд по мере внесения оценок с динамикой относительно предыдущего дня."
      : "Current team standings as scores are entered, with movement against the previous day."
  }

  return locale === "ru"
    ? "Результаты команд остаются доступны отдельно по компетенциям, а сводные режимы вынесены во вкладки."
    : "Team results remain separated by competency; overall views are available in separate tabs."
}
