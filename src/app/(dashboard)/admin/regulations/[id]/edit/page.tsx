"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Protocol {
  id: string
  title: string
  content: string
  version: number
  eventId: string
}

export default function EditRegulationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: protocolId } = use(params)
  const { t } = useI18n()
  const router = useRouter()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [protocol, setProtocol] = useState<Protocol | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchProtocol()
  }, [protocolId])

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [content])

  const fetchProtocol = async () => {
    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}`)
      if (response.ok) {
        const data = await response.json()
        setProtocol(data)
        setTitle(data.title)
        setContent(data.content)
      }
    } catch (error) {
      console.error("Error fetching protocol:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
        }),
      })

      if (response.ok) {
        router.push("/admin/regulations")
      } else {
        const data = await response.json()
        setError(data.error || t.regulationsAdmin.updateError)
      }
    } catch (error) {
      setError(t.regulationsAdmin.saveError)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!protocol) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{t.regulations.notFound}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Link href="/admin/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.regulationsAdmin.editTitle}</h1>
          <p className="text-gray-500 mt-1">{t.events.version} {protocol.version}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>{t.regulationsAdmin.regulationContent}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t.regulationsAdmin.regulationTitle}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t.regulationsAdmin.titleText}
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {t.regulationsAdmin.versionHint}
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link href="/admin/regulations">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  {t.common.cancel}
                </Button>
              </Link>
              <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
                <Save className="h-4 w-4 mr-2" />
                {t.common.save}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
