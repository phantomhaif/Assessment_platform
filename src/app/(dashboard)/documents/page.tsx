"use client"

import { useEffect, useState } from "react"
import { format } from "date-fns"
import { enUS, ru } from "date-fns/locale"
import { Calendar, Download, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/context"

interface EventDocument {
  id: string
  name: string
  type: string
  language: "RU" | "EN"
  access: string[]
  fileUrl: string
  version: number
  createdAt: string
}

interface EventDocumentGroup {
  id: string
  name: string
  nameEn?: string | null
  competency: string
  competencyEn?: string | null
  eventStart: string
  eventEnd: string
  documents: EventDocument[]
}

export default function DocumentsPage() {
  const { locale, t } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const [events, setEvents] = useState<EventDocumentGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch(`/api/my-documents?lang=${locale}`)
        if (!response.ok) {
          throw new Error("Failed to fetch documents")
        }

        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error("Error fetching participant documents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchDocuments()
  }, [locale])

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText className="h-6 w-6 text-red-600" />
          {t.nav.documents}
        </h1>
        <p className="mt-1 text-gray-500">
          {locale === "ru"
            ? "Документы мероприятий, в которых вы зарегистрированы."
            : "Documents for events you are registered for."}
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru"
              ? "Для ваших мероприятий пока нет доступных документов."
              : "There are no available documents for your events yet."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            const eventName = locale === "en" ? event.nameEn || event.name : event.name
            const competency = locale === "en" ? event.competencyEn || event.competency : event.competency

            return (
              <Card key={event.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{eventName}</CardTitle>
                  <p className="text-sm text-red-600">{competency}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {format(new Date(event.eventStart), "d MMM yyyy", { locale: dateLocale })} -{" "}
                      {format(new Date(event.eventEnd), "d MMM yyyy", { locale: dateLocale })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {event.documents.map((document) => (
                      <div
                        key={document.id}
                        className="flex flex-col gap-3 rounded-lg bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{document.name}</p>
                          <p className="text-sm text-gray-500">
                            {t.events.version} {document.version}
                          </p>
                        </div>
                        <a href={document.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">
                            <Download className="mr-2 h-4 w-4" />
                            {t.common.download}
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
