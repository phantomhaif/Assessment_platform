"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Check, X, Save, Filter, ChevronDown, ChevronRight } from "lucide-react"

interface Criterion {
  id: string
  type: "M" | "J"
  description: string
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

interface Score {
  criterionId: string
  teamId: string
  value: number
}

export default function AdminScoringPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [modules, setModules] = useState<Module[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [scores, setScores] = useState<Map<string, number>>(new Map())
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [selectedTeamId, setSelectedTeamId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState("")

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
        setEvents(data.filter((e: any) =>
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
        data.forEach((score: Score) => {
          scoresMap.set(`${score.criterionId}-${score.teamId}`, score.value)
        })
        setScores(scoresMap)
      }
    } catch (error) {
      console.error("Error fetching scores:", error)
    }
  }

  const handleScoreChange = (criterionId: string, value: number, maxScore: number) => {
    if (value < 0 || value > maxScore) return

    const key = `${criterionId}-${selectedTeamId}`
    setScores(prev => new Map(prev).set(key, value))
  }

  const saveScores = async () => {
    setIsSaving(true)
    setSaveStatus("")

    try {
      const scoresToSave = Array.from(scores.entries())
        .filter(([key]) => key.endsWith(`-${selectedTeamId}`))
        .map(([key, value]) => ({
          criterionId: key.split("-")[0],
          teamId: selectedTeamId,
          value,
        }))

      const response = await fetch(`/api/events/${selectedEventId}/scores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: scoresToSave }),
      })

      if (response.ok) {
        setSaveStatus("Сохранено")
        setTimeout(() => setSaveStatus(""), 3000)
      } else {
        throw new Error("Failed to save")
      }
    } catch (error) {
      setSaveStatus("Ошибка сохранения")
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

  const getScoreKey = (criterionId: string) => `${criterionId}-${selectedTeamId}`

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Оценивание</h1>
          <p className="text-gray-500 mt-1">Выставление оценок командам</p>
        </div>
        {selectedTeamId && (
          <Button onClick={saveScores} isLoading={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Сохранить
          </Button>
        )}
      </div>

      {saveStatus && (
        <div className={`px-4 py-2 rounded-md text-sm ${
          saveStatus === "Сохранено"
            ? "bg-green-50 text-green-700"
            : "bg-red-50 text-red-700"
        }`}>
          {saveStatus}
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Мероприятие
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value)
                  setSelectedTeamId("")
                }}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Выберите мероприятие</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Команда
              </label>
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
                disabled={!selectedEventId}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">Выберите команду</option>
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : !selectedTeamId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Выберите мероприятие и команду для начала оценивания
          </CardContent>
        </Card>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Схема оценки не загружена для этого мероприятия
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    )}
                    <div>
                      <CardTitle className="text-lg">
                        Модуль {module.code}: {module.name}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Набрано: {calculateModuleScore(module).toFixed(1)} / {module.maxScore} баллов
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
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
                            const currentScore = scores.get(key) ?? 0

                            return (
                              <div
                                key={criterion.id}
                                className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex-1">
                                  <p className="text-sm text-gray-700">
                                    {criterion.description}
                                  </p>
                                  {criterion.skillGroup && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      WSSS: {criterion.skillGroup.number}. {criterion.skillGroup.name}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {criterion.type === "M" ? (
                                    // Measurement type - binary
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => handleScoreChange(criterion.id, 0, criterion.maxScore)}
                                        className={`p-2 rounded-md transition-colors ${
                                          currentScore === 0
                                            ? "bg-red-100 text-red-700"
                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                        }`}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                      <button
                                        onClick={() => handleScoreChange(criterion.id, criterion.maxScore, criterion.maxScore)}
                                        className={`p-2 rounded-md transition-colors ${
                                          currentScore === criterion.maxScore
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                        }`}
                                      >
                                        <Check className="h-4 w-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    // Judgement type - scale
                                    <select
                                      value={currentScore}
                                      onChange={(e) => handleScoreChange(
                                        criterion.id,
                                        parseFloat(e.target.value),
                                        criterion.maxScore
                                      )}
                                      className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                      {criterion.judgementOptions?.map(option => (
                                        <option key={option.score} value={option.score}>
                                          {option.score} - {option.label.slice(0, 30)}
                                        </option>
                                      )) || (
                                        <>
                                          <option value={0}>0</option>
                                          <option value={1}>1</option>
                                          <option value={2}>2</option>
                                          <option value={3}>3</option>
                                        </>
                                      )}
                                    </select>
                                  )}
                                  <span className="text-sm text-gray-500 w-16 text-right">
                                    {currentScore} / {criterion.maxScore}
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
