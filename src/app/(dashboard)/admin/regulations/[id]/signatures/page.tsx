"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Check, X, Send, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { format } from "date-fns"
import { ru, enUS } from "date-fns/locale"

interface SignatureInfo {
  userId: string
  userName: string
  email: string
  role: string
  isSigned: boolean
  signedAt?: string | null
}

export default function ProtocolSignaturesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: protocolId } = use(params)
  const [signatures, setSignatures] = useState<SignatureInfo[]>([])
  const [protocolTitle, setProtocolTitle] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent?: number; error?: string } | null>(null)
  const { t, locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS

  useEffect(() => {
    fetchSignatures()
  }, [protocolId])

  const fetchSignatures = async () => {
    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}/signatures`)
      if (response.ok) {
        const data = await response.json()
        setSignatures(data.signatures)
        setProtocolTitle(data.protocolTitle)
      }
    } catch (error) {
      console.error("Error fetching signatures:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sendReminder = async () => {
    if (!window.confirm(locale === "ru"
      ? "Отправить напоминание всем, кто не подписал протокол?"
      : "Send reminder to all who haven't signed the protocol?")) {
      return
    }

    setIsSending(true)
    setSendResult(null)

    try {
      const response = await fetch(`/api/admin/protocols/${protocolId}/send-reminder`, {
        method: "POST",
      })
      const data = await response.json()
      if (response.ok) {
        setSendResult({ sent: data.sent })
      } else {
        setSendResult({ error: data.error || t.errors.serverError })
      }
    } catch (error) {
      setSendResult({ error: t.errors.serverError })
    } finally {
      setIsSending(false)
    }
  }

  const signed = signatures.filter(s => s.isSigned)
  const unsigned = signatures.filter(s => !s.isSigned)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/admin/regulations">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900">
              {locale === "ru" ? "Подписи протокола" : "Protocol Signatures"}
            </h1>
            <p className="text-gray-500 mt-1">{protocolTitle}</p>
          </div>
        </div>
        {unsigned.length > 0 && (
          <Button onClick={sendReminder} isLoading={isSending} className="w-full sm:w-auto">
            <Send className="h-4 w-4 mr-2" />
            {locale === "ru" ? "Напомнить неподписавшим" : "Remind unsigned"}
          </Button>
        )}
      </div>

      {sendResult && (
        <div className={`px-4 py-3 rounded-md text-sm ${
          sendResult.sent !== undefined
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-red-50 border border-red-200 text-red-700"
        }`}>
          {sendResult.sent !== undefined
            ? (locale === "ru"
                ? `Напоминание отправлено ${sendResult.sent} пользователям`
                : `Reminder sent to ${sendResult.sent} users`)
            : sendResult.error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === "ru" ? "Подписали" : "Signed"}
                </p>
                <p className="text-2xl font-bold">{signed.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <X className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {locale === "ru" ? "Не подписали" : "Unsigned"}
                </p>
                <p className="text-2xl font-bold">{unsigned.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unsigned List */}
      {unsigned.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <X className="h-5 w-5" />
              {locale === "ru" ? "Не подписали" : "Not signed yet"} ({unsigned.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {unsigned.map((sig) => (
                <div key={sig.userId} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{sig.userName}</p>
                    <p className="text-sm text-gray-500">{sig.email} • {t.roles[sig.role.toLowerCase() as keyof typeof t.roles]}</p>
                  </div>
                  <span className="w-fit px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {locale === "ru" ? "Ожидает" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signed List */}
      {signed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              {locale === "ru" ? "Подписали" : "Signed"} ({signed.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {signed.map((sig) => (
                <div key={sig.userId} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{sig.userName}</p>
                    <p className="text-sm text-gray-500">{sig.email} • {t.roles[sig.role.toLowerCase() as keyof typeof t.roles]}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {locale === "ru" ? "Подписано" : "Signed"}
                    </span>
                    {sig.signedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(sig.signedAt), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
