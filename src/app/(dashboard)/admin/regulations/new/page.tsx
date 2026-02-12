"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save } from "lucide-react"

export default function NewRegulationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get("eventId")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!eventId) {
      router.push("/admin/regulations")
    }
  }, [eventId, router])

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px"
    }
  }, [content])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError("")

    try {
      const response = await fetch("/api/admin/protocols", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          title,
          content,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/admin/regulations/${data.id}/assign`)
      } else {
        const data = await response.json()
        setError(data.error || "Ошибка создания регламента")
      }
    } catch (error) {
      setError("Ошибка при сохранении")
    } finally {
      setIsSaving(false)
    }
  }

  if (!eventId) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Новый регламент</h1>
          <p className="text-gray-500 mt-1">Создайте текст регламента для мероприятия</p>
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
            <CardTitle>Содержание регламента</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Название регламента"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Общий регламент соревнований"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Текст регламента
              </label>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[400px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent resize-none"
                placeholder="Введите полный текст регламента..."
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Текст будет отображаться участникам перед подписанием
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/admin/regulations">
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
              <Button type="submit" isLoading={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Сохранить и назначить участникам
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
