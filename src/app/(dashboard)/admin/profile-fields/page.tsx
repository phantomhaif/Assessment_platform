"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Trash2, X } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

interface ProfileField {
  id: string
  name: string
  nameEn: string | null
  type: "TEXT" | "TEXTAREA" | "SELECT" | "DATE"
  required: boolean
  options: string[]
  optionsEn: string[]
  order: number
}

const FIELD_TYPES = [
  { value: "TEXT", labelRu: "Текст", labelEn: "Text" },
  { value: "TEXTAREA", labelRu: "Многострочный текст", labelEn: "Textarea" },
  { value: "SELECT", labelRu: "Выпадающий список", labelEn: "Select" },
  { value: "DATE", labelRu: "Дата", labelEn: "Date" },
]

export default function ProfileFieldsPage() {
  const { t, locale } = useI18n()
  const [fields, setFields] = useState<ProfileField[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingField, setEditingField] = useState<ProfileField | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    nameEn: "",
    type: "TEXT" as ProfileField["type"],
    required: false,
    options: [] as string[],
    optionsEn: [] as string[],
  })
  const [newOption, setNewOption] = useState("")
  const [newOptionEn, setNewOptionEn] = useState("")

  useEffect(() => {
    fetchFields()
  }, [])

  const fetchFields = async () => {
    try {
      const response = await fetch("/api/profile-fields")
      if (response.ok) {
        const data = await response.json()
        setFields(data)
      }
    } catch (error) {
      console.error("Error fetching fields:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingField(null)
    setFormData({ name: "", nameEn: "", type: "TEXT", required: false, options: [], optionsEn: [] })
    setNewOption("")
    setNewOptionEn("")
    setError("")
    setShowModal(true)
  }

  const openEditModal = (field: ProfileField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      nameEn: field.nameEn || "",
      type: field.type,
      required: field.required,
      options: field.options || [],
      optionsEn: field.optionsEn || [],
    })
    setNewOption("")
    setNewOptionEn("")
    setError("")
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError(locale === "ru" ? "Введите название поля" : "Enter field name")
      return
    }

    if (formData.type === "SELECT" && formData.options.length < 2) {
      setError(locale === "ru" ? "Добавьте минимум 2 варианта" : "Add at least 2 options")
      return
    }

    setIsSaving(true)
    setError("")

    try {
      const url = editingField
        ? `/api/profile-fields/${editingField.id}`
        : "/api/profile-fields"
      const method = editingField ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setShowModal(false)
      fetchFields()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (fieldId: string) => {
    if (!window.confirm(locale === "ru" ? "Удалить это поле?" : "Delete this field?")) {
      return
    }

    try {
      const response = await fetch(`/api/profile-fields/${fieldId}`, {
        method: "DELETE",
      })
      if (response.ok) {
        fetchFields()
      }
    } catch (error) {
      console.error("Error deleting field:", error)
    }
  }

  const addOption = () => {
    if (newOption.trim()) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()],
        optionsEn: [...prev.optionsEn, newOptionEn.trim() || newOption.trim()],
      }))
      setNewOption("")
      setNewOptionEn("")
    }
  }

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
      optionsEn: prev.optionsEn.filter((_, i) => i !== index),
    }))
  }

  const getTypeLabel = (type: string) => {
    const t = FIELD_TYPES.find(ft => ft.value === type)
    return locale === "ru" ? t?.labelRu : t?.labelEn
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "ru" ? "Поля профиля" : "Profile Fields"}
          </h1>
          <p className="text-gray-500 mt-1">
            {locale === "ru"
              ? "Настройте дополнительные поля, которые будут отображаться в профилях пользователей"
              : "Configure additional fields that will appear in user profiles"
            }
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          {locale === "ru" ? "Добавить поле" : "Add Field"}
        </Button>
      </div>

      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-gray-500">
              {locale === "ru"
                ? "Нет дополнительных полей. Нажмите «Добавить поле», чтобы создать первое."
                : "No custom fields yet. Click 'Add Field' to create one."
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <Card key={field.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{field.name}</span>
                      {field.nameEn && (
                        <span className="text-gray-400">/ {field.nameEn}</span>
                      )}
                      {field.required && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">
                          {locale === "ru" ? "Обязательное" : "Required"}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {getTypeLabel(field.type)}
                      {field.type === "SELECT" && field.options.length > 0 && (
                        <span className="ml-2">
                          ({field.options.join(", ")})
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 self-end sm:self-auto">
                    <Button variant="outline" size="sm" onClick={() => openEditModal(field)}>
                      {locale === "ru" ? "Изменить" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b p-6">
              <h2 className="text-lg font-bold">
                {editingField
                  ? (locale === "ru" ? "Редактировать поле" : "Edit Field")
                  : (locale === "ru" ? "Новое поле" : "New Field")
                }
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Input
                label={locale === "ru" ? "Название (RU) *" : "Name (RU) *"}
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder={locale === "ru" ? "Например: Город проживания" : "E.g.: City of residence"}
              />

              <Input
                label={locale === "ru" ? "Название (EN)" : "Name (EN)"}
                value={formData.nameEn}
                onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                placeholder="E.g.: City"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === "ru" ? "Тип поля" : "Field Type"}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ProfileField["type"] }))}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  {FIELD_TYPES.map(ft => (
                    <option key={ft.value} value={ft.value}>
                      {locale === "ru" ? ft.labelRu : ft.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              {formData.type === "SELECT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {locale === "ru" ? "Варианты ответа" : "Options"}
                  </label>
                  <div className="mb-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <span className="text-xs text-gray-500 font-medium">RU</span>
                    <span className="text-xs text-gray-500 font-medium">EN</span>
                  </div>
                  <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                    <Input
                      value={newOption}
                      onChange={(e) => setNewOption(e.target.value)}
                      placeholder="Вариант (RU)"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                    />
                    <Input
                      value={newOptionEn}
                      onChange={(e) => setNewOptionEn(e.target.value)}
                      placeholder="Option (EN)"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOption())}
                    />
                    <Button type="button" variant="outline" onClick={addOption} className="flex-shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.options.length > 0 && (
                    <div className="space-y-1.5">
                      {formData.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                          <span className="flex-1 text-sm">{opt}</span>
                          <span className="text-gray-300">|</span>
                          <span className="flex-1 text-sm text-gray-500">{formData.optionsEn[i] || opt}</span>
                          <button onClick={() => removeOption(i)} className="text-gray-400 hover:text-red-600 flex-shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="required"
                  checked={formData.required}
                  onChange={(e) => setFormData(prev => ({ ...prev, required: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <label htmlFor="required" className="text-sm text-gray-700">
                  {locale === "ru" ? "Обязательное поле" : "Required field"}
                </label>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t p-6 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setShowModal(false)} className="w-full sm:w-auto">
                {locale === "ru" ? "Отмена" : "Cancel"}
              </Button>
              <Button onClick={handleSave} isLoading={isSaving} className="w-full sm:w-auto">
                {locale === "ru" ? "Сохранить" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
