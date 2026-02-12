"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Check, Clock, ChevronRight } from "lucide-react"

interface Regulation {
  id: string
  title: string
  eventName: string
  createdAt: string
  isSigned: boolean
  signedAt: string | null
}

export default function RegulationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRegulations()
  }, [])

  const fetchRegulations = async () => {
    try {
      const response = await fetch("/api/regulations")
      if (response.ok) {
        const data = await response.json()
        setRegulations(data)
      }
    } catch (error) {
      console.error("Error fetching regulations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  const unsignedRegulations = regulations.filter((r) => !r.isSigned)
  const signedRegulations = regulations.filter((r) => r.isSigned)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Регламенты</h1>
        <p className="text-gray-500 mt-1">
          Ознакомьтесь и подпишите регламенты мероприятий
        </p>
      </div>

      {regulations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Нет доступных регламентов</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {unsignedRegulations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Требуют подписи ({unsignedRegulations.length})
              </h2>
              <div className="space-y-3">
                {unsignedRegulations.map((regulation) => (
                  <Link key={regulation.id} href={`/regulations/${regulation.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {regulation.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {regulation.eventName} &bull; {formatDate(regulation.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            Требует подписи
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {signedRegulations.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Подписанные ({signedRegulations.length})
              </h2>
              <div className="space-y-3">
                {signedRegulations.map((regulation) => (
                  <Link key={regulation.id} href={`/regulations/${regulation.id}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {regulation.title}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {regulation.eventName} &bull; Подписано {formatDate(regulation.signedAt!)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Подписано
                          </span>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
