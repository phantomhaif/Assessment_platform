"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Save, ChevronDown, ChevronRight } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Criterion {
  id: string
  type: "M" | "J"
  description: string
  verificationMethod: string | null
  maxScore: number
  judgementOptions: { score: number; label: string }[] | null
  skillGroup: { name: string; number: number } | null
}

interface SubCriterion {
  id: string
  code: string
  name: string
  criteria: Criterion[]
}

interface Module {
  id: string
  code: string
  name: string
  maxScore: number
  subCriteria: SubCriterion[]
}

interface Team {
  id: string
  name: string
  number: number | null
}

interface EventOption {
  id: string
  name: string
  status: string
  assessmentSchema?: { id: string; name: string } | null
}

interface Score {
  criterionId: string
  teamId: string
  value: number
  comment?: string | null
}

interface ScorePayload {
  criterionId: string
  teamId: string
  value: number
  judgeScores?: number[]
}

export default function AdminScoringPage() {
  const [events, setEvents] = useState<EventOption[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [modules, setModules] = useState<Module[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Map<string, number>>(new Map())
  const [judgeScores, setJudgeScores] = useState<Map<string, (number | null)[]>>(new Map())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")
  const { t } = useI18n()

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchSchema()
      fetchTeams()
    }
  }, [selectedEventId])

  useEffect(() => {
    if (selectedEventId && selectedTeamId) {
      fetchScores()
    }
  }, [selectedEventId, selectedTeamId])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        // Show all events that have assessment schema loaded
        setEvents(data.filter((e: EventOption) =>
          e.assessmentSchema || ["IN_PROGRESS", "SCORING", "RESULTS_PUBLISHED"].includes(e.status)
        ))
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchSchema = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/schema`)
      if (response.ok) {
        const data = await response.json()
        setModules(data.modules || [])
        // Expand first module by default
        if (data.modules?.length > 0) {
          setExpandedModules(new Set([data.modules[0].id]))
        }
      }
    } catch (error) {
      console.error("Error fetching schema:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const response = await fetch(`/api/events/${selectedEventId}/teams`)
      if (response.ok) {
        const data = await response.json()
        setTeams(data)
        if (data.length > 0 && !selectedTeamId) {
          setSelectedTeamId(data[0].id)
        }
      }
    } catch (error) {
      console.error("Error fetching teams:", error)
    }
  }

  const fetchScores = async () => {
    try {
      const response = await fetch(
        `/api/events/${selectedEventId}/scores?teamId=${selectedTeamId}`
      )
      if (response.ok) {
        const data = await response.json()
        const scoresMap = new Map<string, number>()
        const judgeScoresMap = new Map<string, (number | null)[]>()
        data.forEach((score: Score) => {
          const key = `${score.criterionId}-${score.teamId}`
          scoresMap.set(key, score.value)

          if (score.comment) {
            try {
              const parsed = JSON.parse(score.comment)
              const parsedJudgeScores = Array.isArray(parsed)
                ? parsed
                : Array.isArray(parsed?.judgeScores)
                  ? parsed.judgeScores
                  : null

              if (parsedJudgeScores) {
                const normalized = parsedJudgeScores
                  .slice(0, 3)
                  .map((value: unknown) => Number(value))
                  .map((value: number) => (Number.isFinite(value) ? value : 0))
                while (normalized.length < 3) normalized.push(0)
                judgeScoresMap.set(key, normalized)
              }
            } catch {
              // Ignore malformed score comments and continue
            }
          }
        })
        setScores(scoresMap)
        setJudgeScores(judgeScoresMap)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    }
  }

  const handleScoreChange = (criterionId: string, rawValue: string, maxScore: number) => {
    const key = `${criterionId}-${selectedTeamId}`
    const trimmed = rawValue.trim()

    if (trimmed === "") {
      setScores(prev => {
        const next = new Map(prev)
        next.delete(key)
        return next
      })
      return
    }

    const value = Number(trimmed)
    if (!Number.isFinite(value) || value < 0 || value > maxScore) return

    setScores(prev => new Map(prev).set(key, value))
  }

  const getScoreKey = (criterionId: string) => `${criterionId}-${selectedTeamId}`

  const findCriterionById = (criterionId: string): Criterion | null => {
    for (const assessmentModule of modules) {
      for (const subCriterion of assessmentModule.subCriteria) {
        const found = subCriterion.criteria.find(c => c.id === criterionId)
        if (found) return found
      }
    }
    return null
  }

  const getJudgeScaleMax = (criterion: Criterion) => {
    if (!criterion.judgementOptions || criterion.judgementOptions.length === 0) {
      return 3
    }
    const max = Math.max(...criterion.judgementOptions.map(option => option.score))
    return Number.isFinite(max) && max > 0 ? max : 3
  }

  const normalizeJScore = (judgeValues: (number | null)[], criterion: Criterion) => {
    if (judgeValues.some((value) => value === null || value === undefined)) {
      return undefined
    }

    const judgesCount = 3
    const maxJudgeScore = getJudgeScaleMax(criterion)
    const maxRawScore = judgesCount * maxJudgeScore
    if (maxRawScore <= 0 || criterion.maxScore <= 0) return 0

    let rawSum = 0
    for (const value of judgeValues.slice(0, judgesCount)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        rawSum += value
      }
    }

    const normalized = (rawSum / maxRawScore) * criterion.maxScore
    return Math.round(normalized * 100) / 100
  }

  const getJudgeValues = (criterion: Criterion) => {
    const key = getScoreKey(criterion.id)
    const saved = judgeScores.get(key)
    if (saved && saved.length === 3) return saved

    // Fallback for previously saved aggregated J-scores
    const currentScore = scores.get(key) || 0
    const maxJudgeScore = getJudgeScaleMax(criterion)
    if (currentScore > 0 && criterion.maxScore > 0) {
      let derived = Math.min(
        maxJudgeScore,
        Math.max(0, Math.round(((currentScore / criterion.maxScore) * maxJudgeScore) * 100) / 100)
      )

      if (criterion.judgementOptions && criterion.judgementOptions.length > 0) {
        const availableScores = criterion.judgementOptions.map(option => option.score)
        derived = availableScores.reduce((best, candidate) =>
          Math.abs(candidate - derived) < Math.abs(best - derived) ? candidate : best,
          availableScores[0]
        )
      }

      return [derived, derived, derived]
    }

    return [null, null, null]
  }

  const handleJudgeScoreChange = (criterion: Criterion, judgeIndex: number, rawValue: string) => {
    const key = getScoreKey(criterion.id)
    const current = getJudgeValues(criterion)
    const next = [...current]
    const maxJudgeScore = getJudgeScaleMax(criterion)

    if (rawValue.trim() === "") {
      next[judgeIndex] = null
    } else {
      const numericValue = Number(rawValue)
      const safeValue = Number.isFinite(numericValue)
        ? Math.min(maxJudgeScore, Math.max(0, numericValue))
        : 0
      next[judgeIndex] = safeValue
    }

    const normalized = normalizeJScore(next, criterion)

    setJudgeScores(prev => new Map(prev).set(key, next))
    setScores(prev => {
      const nextScores = new Map(prev)
      if (normalized === undefined) {
        nextScores.delete(key)
      } else {
        nextScores.set(key, normalized)
      }
      return nextScores
    })
  }

  // Check for missing criteria
  const checkMissingCriteria = () => {
    const missingCriteria: string[] = []
    modules.forEach(module => {
      module.subCriteria.forEach(sub => {
        sub.criteria.forEach(criterion => {
          const key = getScoreKey(criterion.id)
          const score = scores.get(key)
          if (score === undefined || score === null) {
            missingCriteria.push(`${module.code}.${sub.code}: ${criterion.description}`)
          }
        })
      })
    })
    return missingCriteria
  }

  const saveScores = async (force: boolean = false) => {
    // Check for missing criteria
    const missing = checkMissingCriteria()
    if (missing.length > 0 && !force) {
      const message = `${t.scoring.missingCriteria || "Не все критерии заполнены"}:\n\n${missing.slice(0, 10).join("\n")}${missing.length > 10 ? `\n\n...и еще ${missing.length - 10}` : ""}\n\n${t.scoring.saveAnyway || "Сохранить частично заполненные оценки?"}`
      if (!window.confirm(message)) {
        return
      }
    }

    setIsSaving(true)
    setSaveStatus("")

    try {
      const scoresToSave: ScorePayload[] = Array.from(scores.entries())
        .filter(([key]) => key.endsWith(`-${selectedTeamId}`))
        .map(([key, value]) => {
          const criterionId = key.split("-")[0]
          const criterion = findCriterionById(criterionId)
          const payload: ScorePayload = {
            criterionId,
            teamId: selectedTeamId,
            value,
          }

          if (criterion?.type === "J") {
            payload.judgeScores = getJudgeValues(criterion).map((value) => value ?? 0)
          }

          return payload
        })

      const response = await fetch(`/api/events/${selectedEventId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: scoresToSave }),
      })

      if (response.ok) {
        setSaveStatus(missing.length === 0 ? t.scoring.saved : (t.scoring.savedPartial || "Оценки сохранены частично"))
        setTimeout(() => setSaveStatus(""), 3000)
      } else {
        throw new Error("Failed to save")
      }
    } catch {
      setSaveStatus(t.scoring.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  const calculateModuleScore = (module: Module) => {
    let score = 0
    module.subCriteria.forEach(sub => {
      sub.criteria.forEach(criterion => {
        const key = getScoreKey(criterion.id)
        score += scores.get(key) || 0
      })
    })
    return score
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.scoring.title}</h1>
          <p className="text-gray-500 mt-1">{t.scoring.subtitle}</p>
        </div>
        {selectedTeamId && (
          <Button onClick={() => saveScores()} isLoading={isSaving} className="w-full sm:w-auto">
            <Save className="h-4 w-4 mr-2" />
            {t.common.save}
          </Button>
        )}
      </div>

      {saveStatus && (
        <div className={`px-4 py-2 rounded-md text-sm ${
          saveStatus === t.scoring.saved
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
        }`}>
          {saveStatus}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.nav.events}
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value)
                  setSelectedTeamId("")
                }}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">{t.applications.selectEvent}</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.scoring.team}
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={!selectedEventId}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                <option value="">{t.scoring.selectTeam}</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.number ? `#${team.number} ` : ""}{team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring Interface */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      ) : !selectedTeamId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {t.scoring.selectEventAndTeam}
          </CardContent>
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {t.scoring.schemaNotLoaded}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules.map(module => (
            <Card key={module.id}>
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        {t.scoring.module} {module.code}: {module.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {t.scoring.earned}: {calculateModuleScore(module).toFixed(1)} / {module.maxScore} {t.scoring.points}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {((calculateModuleScore(module) / module.maxScore) * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedModules.has(module.id) && (
                <CardContent>
                  <div className="space-y-6">
                    {module.subCriteria.map(subCriterion => (
                      <div key={subCriterion.id}>
                        <h4 className="font-medium text-gray-900 mb-3">
                          {subCriterion.code}. {subCriterion.name}
                        </h4>
                        <div className="space-y-3">
                          {subCriterion.criteria.map(criterion => {
                            const key = getScoreKey(criterion.id)
                            const currentScore = scores.get(key)
                            const currentJudgeValues = getJudgeValues(criterion)

                            return (
                              <div
                                key={criterion.id}
                                className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg md:flex-row md:items-start md:gap-4"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">
                                    {criterion.description}
                                  </p>
                                  {criterion.verificationMethod && (
                                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                                      {criterion.verificationMethod}
                                    </p>
                                  )}
                                  {criterion.skillGroup && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      WSSS: {criterion.skillGroup.number}. {criterion.skillGroup.name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 md:shrink-0 md:justify-end">
                                  {criterion.type === "M" ? (
                                    // Measurement type - numeric input with 0.5 step
                                    <input
                                      type="number"
                                      min={0}
                                      max={criterion.maxScore}
                                      step={0.5}
                                      value={currentScore ?? ""}
                                      onChange={(e) => handleScoreChange(
                                        criterion.id,
                                        e.target.value,
                                        criterion.maxScore
                                      )}
                                      className="w-20 h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                                      placeholder={locale === "ru" ? "—" : "-"}
                                    />
                                  ) : (
                                    <div className="flex w-full flex-col items-start gap-2 sm:w-auto md:items-end">
                                      <div className="flex flex-wrap items-center gap-1">
                                        {[0, 1, 2].map(judgeIndex => {
                                          const value = currentJudgeValues[judgeIndex] ?? 0

                                          return criterion.judgementOptions && criterion.judgementOptions.length > 0 ? (
                                            <select
                                              key={judgeIndex}
                                              value={value === null ? "" : String(value)}
                                              onChange={(e) => handleJudgeScoreChange(
                                                criterion,
                                                judgeIndex,
                                                e.target.value
                                              )}
                                              className="h-9 w-24 min-w-24 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                              title={`Judge ${judgeIndex + 1}`}
                                            >
                                              <option value="">{locale === "ru" ? "—" : "-"}</option>
                                              {criterion.judgementOptions.map(option => (
                                                <option key={option.score} value={option.score}>
                                                  {option.score}
                                                </option>
                                              ))}
                                            </select>
                                          ) : (
                                            <input
                                              key={judgeIndex}
                                              type="number"
                                              min={0}
                                              max={getJudgeScaleMax(criterion)}
                                              step={0.5}
                                              value={value ?? ""}
                                              onChange={(e) => handleJudgeScoreChange(
                                                criterion,
                                                judgeIndex,
                                                e.target.value
                                              )}
                                              className="w-24 h-9 rounded-md border border-gray-300 bg-white px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                                              title={`Judge ${judgeIndex + 1}`}
                                              placeholder={locale === "ru" ? "—" : "-"}
                                            />
                                          )
                                        })}
                                      </div>
                                      <p className="text-[11px] text-gray-500">
                                        {"J1 + J2 + J3 -> "}{currentScore !== undefined ? currentScore.toFixed(2) : "—"}
                                      </p>
                                    </div>
                                  )}
                                  <span className="w-auto text-sm text-gray-500 sm:w-16 sm:text-right">
                                    {currentScore !== undefined ? currentScore : "—"} / {criterion.maxScore}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
