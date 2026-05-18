"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/context"
import {
  getOrganizationTypeLabel,
  normalizeOrganizationName,
  normalizeOrganizationType,
  ORGANIZATION_TYPES,
} from "@/lib/organizations"

interface Organization {
  id: string
  name: string
  type: string | null
  country: string | null
  isApproved: boolean
  createdAt: string
  _count: {
    users: number
  }
}

type OrganizationTypeFilter = "ALL" | (typeof ORGANIZATION_TYPES)[number]

const EMPTY_FORM = {
  name: "",
  type: "",
  country: "",
  isApproved: true,
}

export default function AdminOrganizationsPage() {
  const { locale } = useI18n()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<OrganizationTypeFilter>("ALL")
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [mergeIntoId, setMergeIntoId] = useState("")
  const [error, setError] = useState("")

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/organizations")
      if (response.ok) {
        setOrganizations(await response.json())
      }
    } catch (error) {
      console.error("Error fetching organizations:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void fetchOrganizations()
  }, [])

  const filteredOrganizations = useMemo(() => {
    const query = search.trim().toLowerCase()
    return organizations.filter((organization) => {
      const matchesSearch = !query || organization.name.toLowerCase().includes(query)
      const matchesType =
        typeFilter === "ALL" || normalizeOrganizationType(organization.type) === typeFilter
      return matchesSearch && matchesType
    })
  }, [organizations, search, typeFilter])

  const mergeTargets = useMemo(
    () => organizations.filter((organization) => organization.id !== editingId),
    [organizations, editingId]
  )

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setMergeIntoId("")
    setError("")
  }

  const saveOrganization = async () => {
    setError("")

    const name = normalizeOrganizationName(form.name)
    if (!name && !editingId) {
      setError(locale === "ru" ? "Введите название организации" : "Enter organization name")
      return
    }

    if (editingId && mergeIntoId) {
      const response = await fetch(`/api/admin/organizations/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mergeIntoId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setError(data?.error || (locale === "ru" ? "Ошибка слияния" : "Merge error"))
        return
      }

      resetForm()
      await fetchOrganizations()
      return
    }

    try {
      const response = await fetch(editingId ? `/api/admin/organizations/${editingId}` : "/api/admin/organizations", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type: normalizeOrganizationType(form.type),
          country: normalizeOrganizationName(form.country),
          isApproved: form.isApproved,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || "Save error")
      }

      resetForm()
      await fetchOrganizations()
    } catch (error) {
      setError(error instanceof Error ? error.message : locale === "ru" ? "Ошибка сохранения" : "Save error")
    }
  }

  const editOrganization = (organization: Organization) => {
    setEditingId(organization.id)
    setForm({
      name: organization.name,
      type: normalizeOrganizationType(organization.type) || "",
      country: organization.country || "",
      isApproved: organization.isApproved,
    })
    setMergeIntoId("")
    setError("")
  }

  const approveOrganization = async (organization: Organization) => {
    await fetch(`/api/admin/organizations/${organization.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved: true }),
    })
    await fetchOrganizations()
  }

  const deleteOrganization = async (organization: Organization) => {
    if (!confirm(locale === "ru" ? `Удалить "${organization.name}"?` : `Delete "${organization.name}"?`)) return

    const response = await fetch(`/api/admin/organizations/${organization.id}`, { method: "DELETE" })
    if (!response.ok) {
      const data = await response.json().catch(() => null)
      setError(data?.error || (locale === "ru" ? "Нельзя удалить организацию" : "Cannot delete organization"))
      return
    }

    await fetchOrganizations()
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {locale === "ru" ? "Организации" : "Organizations"}
        </h1>
        <p className="mt-1 text-gray-500">
          {locale === "ru" ? "Справочник для автодополнения при регистрации" : "Directory used for registration autocomplete"}
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_1fr_1fr_auto]">
            <Input
              label={locale === "ru" ? "Название" : "Name"}
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />

            <label className="flex flex-col gap-2 text-sm font-medium text-[#b8c5d5]">
              <span>{locale === "ru" ? "Тип" : "Type"}</span>
              <select
                value={form.type}
                onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value }))}
                className="h-10 rounded-md border border-white/[0.12] bg-white/[0.055] px-3 text-sm text-[#dce4f0]"
              >
                <option value="">{locale === "ru" ? "Не задан" : "Unset"}</option>
                <option value="EDUCATIONAL">{locale === "ru" ? "Образовательная организация" : "Educational organization"}</option>
                <option value="COMMERCIAL">{locale === "ru" ? "Коммерческая организация" : "Commercial organization"}</option>
              </select>
            </label>

            <Input
              label={locale === "ru" ? "Страна" : "Country"}
              value={form.country}
              onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))}
            />

            <div className="flex items-end gap-2">
              <label className="flex h-10 items-center gap-2 rounded-md border border-white/[0.12] px-3 text-sm text-[#dce4f0]">
                <input
                  type="checkbox"
                  checked={form.isApproved}
                  onChange={(event) => setForm((prev) => ({ ...prev, isApproved: event.target.checked }))}
                />
                {locale === "ru" ? "Одобрено" : "Approved"}
              </label>
            </div>
          </div>

          {editingId && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_1fr]">
              <label className="flex flex-col gap-2 text-sm font-medium text-[#b8c5d5]">
                <span>{locale === "ru" ? "Слить в организацию" : "Merge into organization"}</span>
                <select
                  value={mergeIntoId}
                  onChange={(event) => setMergeIntoId(event.target.value)}
                  className="h-10 rounded-md border border-white/[0.12] bg-white/[0.055] px-3 text-sm text-[#dce4f0]"
                >
                  <option value="">{locale === "ru" ? "Не сливать" : "Do not merge"}</option>
                  {mergeTargets.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end">
                <p className="text-xs text-[#7d8da1]">
                  {locale === "ru"
                    ? "Слияние переносит всех пользователей в целевую запись и удаляет дубль."
                    : "Merge moves all users to the target record and removes the duplicate."}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                {locale === "ru" ? "Сбросить" : "Reset"}
              </Button>
            )}
            <Button onClick={saveOrganization}>
              {editingId
                ? locale === "ru"
                  ? "Сохранить"
                  : "Save"
                : locale === "ru"
                  ? "Добавить"
                  : "Add"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              placeholder={locale === "ru" ? "Поиск по названию" : "Search by name"}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as OrganizationTypeFilter)}
              className="h-10 rounded-md border border-white/[0.12] bg-white/[0.055] px-3 text-sm text-[#dce4f0]"
            >
              <option value="ALL">{locale === "ru" ? "Все типы" : "All types"}</option>
              <option value="EDUCATIONAL">{locale === "ru" ? "Образовательные" : "Educational"}</option>
              <option value="COMMERCIAL">{locale === "ru" ? "Коммерческие" : "Commercial"}</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[880px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Название" : "Name"}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Тип" : "Type"}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Страна" : "Country"}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Статус" : "Status"}</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Пользователи" : "Users"}</th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">{locale === "ru" ? "Действия" : "Actions"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOrganizations.map((organization) => (
              <tr key={organization.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{organization.name}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{getOrganizationTypeLabel(organization.type, locale)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{organization.country || "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      organization.isApproved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {organization.isApproved
                      ? locale === "ru"
                        ? "Одобрено"
                        : "Approved"
                      : locale === "ru"
                        ? "На модерации"
                        : "Pending"}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{organization._count.users}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {!organization.isApproved && (
                      <Button variant="outline" size="sm" onClick={() => approveOrganization(organization)}>
                        {locale === "ru" ? "Одобрить" : "Approve"}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => editOrganization(organization)}>
                      {locale === "ru" ? "Править" : "Edit"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => deleteOrganization(organization)}
                    >
                      {locale === "ru" ? "Удалить" : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
