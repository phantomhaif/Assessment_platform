"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n/context"

interface UserOption {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export function OrganizerManager({ eventId }: { eventId: string }) {
  const { data: session } = useSession()
  const { locale } = useI18n()
  const [users, setUsers] = useState<UserOption[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")

  const isAdmin = session?.user?.role === "ADMIN"
  const ru = locale === "ru"

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    ;(async () => {
      try {
        const [usersRes, organizersRes] = await Promise.all([
          fetch("/api/users"),
          fetch(`/api/events/${eventId}/organizers`),
        ])
        if (active && usersRes.ok) setUsers(await usersRes.json())
        if (active && organizersRes.ok) {
          const organizers: UserOption[] = await organizersRes.json()
          setSelected(new Set(organizers.map((o) => o.id)))
        }
      } catch (error) {
        console.error("Error loading organizers:", error)
      } finally {
        if (active) setIsLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [eventId, isAdmin])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter((u) =>
      `${u.lastName} ${u.firstName} ${u.email}`.toLowerCase().includes(q)
    )
  }, [users, search])

  if (!isAdmin) return null

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const save = async () => {
    setIsSaving(true)
    setMessage("")
    try {
      const response = await fetch(`/api/events/${eventId}/organizers`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userIds: [...selected] }),
      })
      if (!response.ok) throw new Error("save failed")
      setMessage(ru ? "Организаторы сохранены" : "Organizers saved")
    } catch {
      setMessage(ru ? "Не удалось сохранить" : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{ru ? "Организаторы мероприятия" : "Event organizers"}</CardTitle>
        <p className="text-sm text-gray-500">
          {ru
            ? "Назначенные организаторы могут управлять только этим мероприятием и его участниками."
            : "Assigned organizers can manage only this event and its participants."}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-gray-500">{ru ? "Загрузка…" : "Loading…"}</p>
        ) : (
          <>
            <Input
              placeholder={ru ? "Поиск по имени или email" : "Search by name or email"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="max-h-72 overflow-y-auto rounded-lg border border-white/10 divide-y divide-white/5">
              {filtered.length === 0 && (
                <p className="p-3 text-sm text-gray-500">
                  {ru ? "Пользователи не найдены" : "No users found"}
                </p>
              )}
              {filtered.map((u) => (
                <label
                  key={u.id}
                  className="flex cursor-pointer items-center gap-3 p-3 text-sm hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#C41E3A]"
                    checked={selected.has(u.id)}
                    onChange={() => toggle(u.id)}
                  />
                  <span className="flex-1">
                    {u.lastName} {u.firstName}
                    <span className="ml-2 text-gray-500">{u.email}</span>
                  </span>
                  <span className="text-xs text-gray-500">{u.role}</span>
                </label>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-gray-500">
                {ru ? "Выбрано" : "Selected"}: {selected.size}
                {message ? ` · ${message}` : ""}
              </span>
              <Button onClick={save} isLoading={isSaving}>
                {ru ? "Сохранить организаторов" : "Save organizers"}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
