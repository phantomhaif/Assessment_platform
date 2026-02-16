"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Check, FileText, Calendar, Building } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface Regulation {
  id: string
  title: string
  content: string
  version: number
  eventId: string
  eventName: string
  createdAt: string
  isSigned: boolean
  signedAt: string | null
}

export default function RegulationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { t, locale } = useI18n()
  const [regulation, setRegulation] = useState<Regulation | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSigning, setIsSigning] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRegulation()
  }, [id])

  const fetchRegulation = async () => {
    try {
      const response = await fetch(`/api/regulations/${id}`)
      if (response.ok) {
        const data = await response.json()
        setRegulation(data)
      } else {
        setError(t.regulations.notFound)
      }
    } catch (error) {
      console.error("Error fetching regulation:", error)
      setError(t.regulations.loadError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSign = async () => {
    setIsSigning(true)
    setError("")

    try {
      const response = await fetch(`/api/regulations/${id}/sign`, {
        method: "POST",
      })

      if (response.ok) {
        const data = await response.json()
        setRegulation((prev) =>
          prev ? { ...prev, isSigned: true, signedAt: data.signedAt } : null
        )
      } else {
        const data = await response.json()
        setError(data.error || t.regulations.signError)
      }
    } catch (error) {
      console.error("Error signing regulation:", error)
      setError(t.regulations.signErrorDetail)
    } finally {
      setIsSigning(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === "ru" ? "ru-RU" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error && !regulation) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{error}</p>
            <Link href="/regulations">
              <Button variant="outline" className="mt-4">
                {t.regulations.backToList}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!regulation) return null

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/regulations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{regulation.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {regulation.eventName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t.regulations.version} {regulation.version}
            </span>
          </div>
        </div>
      </div>

      {/* Status banner */}
      {regulation.isSigned ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Check className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-green-800">{t.regulations.regulationSigned}</p>
            <p className="text-sm text-green-600">
              {t.regulations.youSignedOn} {formatDate(regulation.signedAt!)}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <FileText className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <p className="font-medium text-orange-800">{t.regulations.signatureRequired}</p>
            <p className="text-sm text-orange-600">
              {t.regulations.pleaseReview}
            </p>
          </div>
        </div>
      )}

      {/* Regulation content */}
      <Card>
        <CardHeader>
          <CardTitle>{t.regulations.content}</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-gray max-w-none"
            style={{ whiteSpace: "pre-wrap" }}
          >
            {regulation.content}
          </div>
        </CardContent>
      </Card>

      {/* Sign button */}
      {!regulation.isSigned && (
        <Card>
          <CardContent className="p-6">
            {error && (
              <div className="mb-4 px-4 py-3 rounded-md text-sm bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {t.regulations.confirmReading}
                </p>
                <p className="text-sm text-gray-500">
                  {t.regulations.confirmText}
                </p>
              </div>
              <Button
                onClick={handleSign}
                disabled={isSigning}
                className="min-w-[150px]"
              >
                {isSigning ? (
                  t.regulations.signing
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t.regulations.agree}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
