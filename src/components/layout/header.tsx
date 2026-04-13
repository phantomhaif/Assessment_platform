"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Bell, User, Menu } from "lucide-react"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useI18n } from "@/lib/i18n/context"

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const { locale, t } = useI18n()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/notifications?limit=1")
        if (!response.ok) return

        const data = await response.json()
        setUnreadCount(data.unreadCount || 0)
      } catch (error) {
        console.error("Error fetching unread notifications:", error)
      }
    }

    if (session?.user?.id) {
      fetchUnreadCount()
    }
  }, [session?.user?.id])

  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case "ADMIN": return t.roles.admin
      case "ORGANIZER": return t.roles.organizer
      case "EXPERT": return t.roles.expert
      case "PARTICIPANT": return t.roles.participant
      default: return t.roles.guest
    }
  }

  const userName = session?.user?.name || ""
  const greetingFull = locale === "ru"
    ? `Добро пожаловать, ${userName}`
    : `Welcome, ${userName}`

  return (
    <header className="flex min-h-16 items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="truncate font-semibold text-gray-900 text-sm md:text-lg">
          <span className="md:hidden">{userName}</span>
          <span className="hidden md:inline">{greetingFull}</span>
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <LanguageSwitcher />
        <Link
          href="/notifications"
          className="relative inline-flex rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-red-600" />
          </div>
          <span className="hidden sm:inline text-sm font-medium text-gray-700">
            {getRoleName(session?.user?.role)}
          </span>
        </div>
      </div>
    </header>
  )
}
