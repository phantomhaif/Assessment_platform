"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileText, Upload, Download, Trash2, X } from "lucide-react"

export default function AdminDocumentsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [documents, setDocuments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: "",
    type: "OTHER",
    access: "PARTICIPANTS",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    if (selectedEventId) {
      fetchDocuments()
    }
  }, [selectedEventId])

  const fetchEvents = async () => {
    try {
      const response = await fetch("/api/events")
      if (response.ok) {
        const data = await response.json()
        setEvents(data)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    }
  }

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/events/${selectedEventId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error("Error fetching documents:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile || !uploadForm.name) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("name", uploadForm.name)
      formData.append("type", uploadForm.type)
      formData.append("access", uploadForm.access)

      const response = await fetch(`/api/events/${selectedEventId}/documents`, {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        setShowUploadForm(false)
        setUploadForm({ name: "", type: "OTHER", access: "PARTICIPANTS" })
        setSelectedFile(null)
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error uploading document:", error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Удалить этот документ?")) return

    try {
      const response = await fetch(
        `/api/events/${selectedEventId}/documents?documentId=${documentId}`,
        { method: "DELETE" }
      )
      if (response.ok) {
        fetchDocuments()
      }
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const documentTypes: Record<string, string> = {
    REGULATION: "Регламент",
    SMP: "SMP",
    INFRASTRUCTURE: "Инфраструктурный лист",
    SCHEDULE: "Расписание",
    OTHER: "Другое",
  }

  const accessTypes: Record<string, string> = {
    PUBLIC: "Публичный",
    PARTICIPANTS: "Участники",
    EXPERTS: "Эксперты",
    ORGANIZERS: "Организаторы",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Документы</h1>
          <p className="text-gray-500 mt-1">Управление документами мероприятий</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Мероприятие
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Выберите мероприятие</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {!selectedEventId ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Выберите мероприятие для управления документами
          </CardContent>
        </Card>
      ) : (
        <>
          {showUploadForm && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Загрузить документ</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowUploadForm(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpload} className="space-y-4">
                  <Input
                    label="Название документа"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тип документа
                      </label>
                      <select
                        value={uploadForm.type}
                        onChange={(e) => setUploadForm({ ...uploadForm, type: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                      >
                        {Object.entries(documentTypes).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Доступ
                      </label>
                      <select
                        value={uploadForm.access}
                        onChange={(e) => setUploadForm({ ...uploadForm, access: e.target.value })}
                        className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm"
                      >
                        {Object.entries(accessTypes).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Файл
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => setShowUploadForm(false)}>
                      Отмена
                    </Button>
                    <Button type="submit" disabled={isUploading}>
                      {isUploading ? "Загрузка..." : "Загрузить"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Документы мероприятия</CardTitle>
              {!showUploadForm && (
                <Button onClick={() => setShowUploadForm(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Загрузить документ
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Нет загруженных документов</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {documentTypes[doc.type]} • {accessTypes[doc.access]} • Версия {doc.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
