"use client"

import { useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Send, Eye, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function SendEmailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const { t, locale } = useI18n()

  const [subject, setSubject] = useState("")
  const [bodyRu, setBodyRu] = useState("")
  const [bodyEn, setBodyEn] = useState("")
  const [preview, setPreview] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<{ sent?: number; error?: string } | null>(null)
  const [sendToAll, setSendToAll] = useState(true)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const handleSend = async () => {
    if (!subject.trim() || !bodyRu.trim()) {
      setResult({ error: t.massEmail.fillRequired })
      return
    }

    const confirmed = window.confirm(t.massEmail.confirmSend)
    if (!confirmed) return

    setIsSending(true)
    setResult(null)

    try {
      const res = await fetch(`/api/events/${eventId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          bodyRu,
          bodyEn,
          roles: sendToAll ? ["ALL"] : selectedRoles
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult({ sent: data.sent })
      } else {
        setResult({ error: data.error || t.errors.serverError })
      }
    } catch {
      setResult({ error: t.errors.serverError })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.massEmail.title}</h1>
          <p className="text-gray-500 mt-1">{t.massEmail.subtitle}</p>
        </div>
      </div>

      {result && (
        <div className={`px-4 py-3 rounded-md text-sm ${
          result.sent !== undefined
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {result.sent !== undefined
            ? t.massEmail.sentSuccess.replace("{count}", String(result.sent))
            : result.error}
        </div>
      )}

      {/* Recipients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {locale === "ru" ? "Получатели" : "Recipients"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sendToAll"
              checked={sendToAll}
              onChange={(e) => {
                setSendToAll(e.target.checked)
                if (e.target.checked) setSelectedRoles([])
              }}
              className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="sendToAll" className="text-sm font-medium text-gray-900">
              {locale === "ru" ? "Отправить всем одобренным участникам" : "Send to all approved participants"}
            </label>
          </div>

          {!sendToAll && (
            <div className="ml-6 space-y-2">
              <p className="text-sm text-gray-600 mb-2">
                {locale === "ru" ? "Выберите роли получателей:" : "Select recipient roles:"}
              </p>
              {[
                { value: "PARTICIPANT", label: t.roles.participant },
                { value: "EXPERT", label: t.roles.expert },
                { value: "ORGANIZER", label: t.roles.organizer },
              ].map((role) => (
                <div key={role.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`role-${role.value}`}
                    checked={selectedRoles.includes(role.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.value])
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role.value))
                      }
                    }}
                    className="h-4 w-4 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor={`role-${role.value}`} className="text-sm text-gray-700">
                    {role.label}
                  </label>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.massEmail.compose}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label={t.massEmail.subject + " *"}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t.massEmail.subjectPlaceholder}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.massEmail.bodyRu} *
              <span className="ml-2 text-xs font-normal text-gray-400">🇷🇺</span>
            </label>
            <textarea
              value={bodyRu}
              onChange={(e) => setBodyRu(e.target.value)}
              rows={8}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t.massEmail.bodyRuPlaceholder}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.massEmail.bodyEn}
              <span className="ml-2 text-xs font-normal text-gray-400">🇬🇧</span>
            </label>
            <textarea
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              rows={8}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder={t.massEmail.bodyEnPlaceholder}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (bodyRu || bodyEn) && (
        <Card>
          <CardHeader>
            <CardTitle>{t.massEmail.preview}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", padding: "24px 32px" }}>
                <div className="flex items-center gap-3">
                  <div style={{ width: 40, height: 40, background: "#C41E3A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span className="text-white font-bold text-sm">IS</span>
                  </div>
                  <span className="text-white font-bold">Industry Skills</span>
                </div>
              </div>
              <div className="bg-white p-8 space-y-6">
                {bodyRu && (
                  <div>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">🇷🇺 РУССКИЙ</span>
                    <p className="mt-3 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{bodyRu}</p>
                  </div>
                )}
                {bodyEn && (
                  <>
                    <hr className="border-gray-200" />
                    <div>
                      <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded">🇬🇧 ENGLISH</span>
                      <p className="mt-3 text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{bodyEn}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setPreview((p) => !p)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {preview ? t.massEmail.hidePreview : t.massEmail.showPreview}
        </Button>

        <Button onClick={handleSend} isLoading={isSending}>
          <Send className="h-4 w-4 mr-2" />
          {t.massEmail.sendToAll}
        </Button>
      </div>
    </div>
  )
}
