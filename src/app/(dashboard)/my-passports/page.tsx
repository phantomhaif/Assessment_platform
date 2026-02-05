"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Award, Download, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ru } from "date-fns/locale"

interface SkillPassport {
  id: string
  totalScore: number
  moduleScores: { code: string; name: string; score: number; maxScore: number }[]
  skillGroupScores: { number: number; name: string; score: number; maxScore: number }[]
  publishedAt: string
  event: {
    name: string
    competency: string
    eventStart: string
    eventEnd: string
  }
}

export default function MyPassportsPage() {
  const [passports, setPassports] = useState<SkillPassport[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Мои Skill Passports</h1>
        <p className="text-gray-500 mt-1">Ваши сертификаты и результаты соревнований</p>
      </div>

      {passports.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет паспортов компетенций
            </h3>
            <p className="text-gray-500">
              После участия в соревнованиях здесь появятся ваши результаты
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {passports.map((passport) => (
            <Card key={passport.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold text-lg">SKILL PASSPORT</h3>
                    <p className="text-red-100 text-sm">Паспорт компетенций</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-3xl font-bold">
                      {passport.totalScore.toFixed(1)}
                    </p>
                    <p className="text-red-100 text-xs">из 100 баллов</p>
                  </div>
                </div>
              </div>

              <CardContent className="p-4">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {passport.event.name}
                </h4>
                <p className="text-sm text-blue-600 mb-2">
                  {passport.event.competency}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(passport.event.eventStart), "d MMM", { locale: ru })} —{" "}
                  {format(new Date(passport.event.eventEnd), "d MMM yyyy", { locale: ru })}
                </div>

                {/* Module scores preview */}
                <div className="space-y-2 mb-4">
                  {passport.moduleScores.slice(0, 3).map((module) => (
                    <div key={module.code} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {module.code}. {module.name.slice(0, 25)}...
                      </span>
                      <span className="font-medium">
                        {module.score}/{module.maxScore}
                      </span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => downloadPdf(passport.id)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Скачать PDF
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
