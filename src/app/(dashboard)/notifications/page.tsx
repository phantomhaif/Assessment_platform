"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/lib/i18n/context"
import { formatDistanceToNow } from "date-fns"
import { enUS, ru } from "date-fns/locale"

interface NotificationItem {
  id: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  createdAt: string
  type: "INFO" | "SUCCESS" | "WARNING"
}

export default function NotificationsPage() {
  const { locale } = useI18n()
  const dateLocale = locale === "ru" ? ru : enUS
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications")
      if (!response.ok) return

      const data = await response.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const markNotifications = async (ids?: string[], all?: boolean) => {
    const response = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(all ? { all: true } : { ids }),
    })

    if (!response.ok) return

    const data = await response.json()
    setUnreadCount(data.unreadCount || 0)

    if (all) {
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
    } else if (ids?.length) {
      const idsSet = new Set(ids)
      setNotifications((prev) =>
        prev.map((item) => (idsSet.has(item.id) ? { ...item, isRead: true } : item))
      )
    }
  }

  const handleMarkAll = async () => {
    setIsMarkingAll(true)
    try {
      await markNotifications(undefined, true)
    } finally {
      setIsMarkingAll(false)
    }
  }

  const typeStyles: Record<NotificationItem["type"], string> = {
    INFO: "border-blue-200 bg-blue-50",
    SUCCESS: "border-green-200 bg-green-50",
    WARNING: "border-amber-200 bg-amber-50",
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Bell className="h-6 w-6 text-red-600" />
            {locale === "ru" ? "Уведомления" : "Notifications"}
          </h1>
          <p className="mt-1 text-gray-500">
            {locale === "ru"
              ? "Внутренние события платформы и действия команд"
              : "Internal platform activity and team updates"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAll} isLoading={isMarkingAll} className="w-full sm:w-auto">
            <CheckCheck className="mr-2 h-4 w-4" />
            {locale === "ru" ? "Прочитать все" : "Mark all as read"}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            {locale === "ru" ? "Пока нет уведомлений" : "No notifications yet"}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const body = (
              <Card
                key={notification.id}
                className={`border transition-colors ${typeStyles[notification.type]} ${
                  notification.isRead ? "opacity-75" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-start justify-between gap-3 text-base">
                    <span>{notification.title}</span>
                    {!notification.isRead && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-medium text-white">
                        {locale === "ru" ? "Новое" : "New"}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-700">{notification.message}</p>
                  <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-gray-500">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                        locale: dateLocale,
                      })}
                    </span>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!notification.isRead && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                          onClick={() => markNotifications([notification.id])}
                        >
                          {locale === "ru" ? "Отметить прочитанным" : "Mark as read"}
                        </Button>
                      )}
                      {notification.link && (
                        <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) {
                                void markNotifications([notification.id])
                              }
                            }}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {locale === "ru" ? "Открыть" : "Open"}
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )

            return body
          })}
        </div>
      )}
    </div>
  )
}
