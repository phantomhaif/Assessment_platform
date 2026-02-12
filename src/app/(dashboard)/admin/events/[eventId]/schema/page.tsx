"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, CheckCircle, FileSpreadsheet } from "lucide-react"

export default function SchemaUploadPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params)
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [schema, setSchema] = useState<any>(null)

  useEffect(() => {
    fetchSchema()
  }, [eventId])

  const fetchSchema = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/schema`)
      if (response.ok) {
        const data = await response.json()
        setSchema(data)
      }
    } catch (error) {
      console.error("Error fetching schema:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch(`/api/events/${eventId}/schema`, {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: `Схема загружена! Модулей: ${data.modulesCount}, критериев: ${data.criteriaCount}`,
        })
        fetchSchema()
      } else {
        setResult({
          success: false,
          message: data.error || "Ошибка загрузки",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Ошибка загрузки файла",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Схема оценки</h1>
          <p className="text-gray-500">Загрузка Excel-файла со схемой оценивания</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Загрузить схему</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Загрузите Excel-файл (.xlsx) со схемой оценки
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
              <span className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-10 px-4 py-2 bg-red-600 text-white shadow hover:bg-red-700 transition-colors">
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Выбрать файл
                  </>
                )}
              </span>
            </label>
          </div>

          {result && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {result.success && <CheckCircle className="h-5 w-5 inline mr-2" />}
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>

      {schema && (
        <Card>
          <CardHeader>
            <CardTitle>Текущая схема: {schema.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="bg-red-50 text-red-700 px-3 py-1 rounded-full">
                  Модулей: {schema.modules?.length || 0}
                </div>
                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full">
                  Групп навыков: {schema.skillGroups?.length || 0}
                </div>
                <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                  Макс. балл: {schema.totalMaxScore}
                </div>
              </div>

              {schema.modules?.map((module: any) => (
                <div key={module.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">
                    Модуль {module.code}: {module.name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    Макс. балл: {module.maxScore} | Критериев:{" "}
                    {module.subCriteria?.reduce(
                      (sum: number, s: any) => sum + (s.criteria?.length || 0),
                      0
                    ) || 0}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
