"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Download, Calendar, Trophy, Users } from "lucide-react"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"
import { useI18n } from "@/lib/i18n/context"

interface SkillPassport {
  id: string
  totalScore: number
  moduleScores: { code: string; name: string; nameEn?: string | null; score: number; maxScore: number }[]
  skillGroupScores: { number: number; name: string; score: number; maxScore: number }[]
  publishedAt: string
  event: {
    name: string
    nameEn?: string | null
    competency: string
    competencyEn?: string | null
    eventStart: string
    eventEnd: string
  }
  team: {
    name: string
    rank: number | null
    totalScore: number | null
  } | null
}

const getMedalEmoji = (rank: number | null) => {
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return null
}

export default function MyPassportsPage() {
  const [passports, setPassports] = useState<SkillPassport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS

  useEffect(() => {
    fetchPassports()
  }, [])

  const fetchPassports = async () => {
    try {
      const response = await fetch("/api/my-passports")
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

  const downloadPdf = async (passportId: string, downloadLocale: "ru" | "en") => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.passports.myPassports}</h1>
        <p className="text-gray-500 mt-1">{t.passports.subtitle}</p>
      </div>

      {passports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t.passports.noPassports}
            </h3>
            <p className="text-gray-500">
              {t.passports.noPassportsDescription}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passports.map((passport) => (
            <Card key={passport.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">SKILL PASSPORT</h3>
                    <p className="text-red-100 text-sm">{t.passports.skillPassportLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-3xl font-bold">
                      {passport.totalScore.toFixed(1)}
                    </p>
                    <p className="text-red-100 text-xs">
                      {(() => {
                        const maxScore = passport.moduleScores.reduce(
                          (sum, module) => sum + (module.maxScore || 0),
                          0
                        )
                        return locale === "ru" ? `из ${maxScore} баллов` : `out of ${maxScore} points`
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {locale === "en" ? passport.event.nameEn || passport.event.name : passport.event.name}
                </h4>
                <p className="text-sm text-red-600 mb-2">
                  {locale === "en"
                    ? passport.event.competencyEn || passport.event.competency
                    : passport.event.competency}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(passport.event.eventStart), "d MMM", { locale: dateLocale })} —{" "}
                  {format(new Date(passport.event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                </div>

                {/* Team rank display */}
                {passport.team && passport.team.rank && (
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
                        {getMedalEmoji(passport.team.rank) ? (
                          <span className="text-2xl">{getMedalEmoji(passport.team.rank)}</span>
                        ) : (
                          <Trophy className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-900">
                            {passport.team.rank} {t.passports.place}
                          </span>
                        </div>
                        <div className="flex items-center text-sm text-amber-700">
                          <Users className="h-3 w-3 mr-1" />
                          {passport.team.name}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Module scores preview */}
                <div className="space-y-2 mb-4">
                  {passport.moduleScores.slice(0, 3).map((module) => (
                    <div key={module.code} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-gray-600">
                        {module.code}. {locale === "en" ? module.nameEn || module.name : module.name}
                      </span>
                      <span className="font-medium">
                        {module.score}/{module.maxScore}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button
                    onClick={() => downloadPdf(passport.id, "ru")}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {locale === "ru" ? "Скачать PDF (RU)" : "Download PDF (RU)"}
                  </Button>
                  <Button
                    onClick={() => downloadPdf(passport.id, "en")}
                    className="w-full"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {locale === "ru" ? "Скачать PDF (EN)" : "Download PDF (EN)"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
