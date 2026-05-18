"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Image from "next/image"
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
    <header className="topbar">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="rounded-lg p-2 text-[#8ea0b5] transition-colors hover:bg-white/[0.06] hover:text-white md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="topbar-greeting truncate">
          <span className="md:hidden">{userName}</span>
          <span className="hidden md:inline">{greetingFull}</span>
        </h2>
      </div>

      <div className="topbar-actions shrink-0">
        <LanguageSwitcher />
        <Link
          href="/notifications"
          className="icon-btn relative"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Link>
        <div className="flex items-center gap-2">
          <div className="user-avatar !h-8 !w-8">
            {session?.user?.photo ? (
              <Image
                src={session.user.photo}
                alt=""
                width={32}
                height={32}
                className="h-full w-full rounded-[5px] object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-[#ff8da3]" />
            )}
          </div>
          <span className="hidden text-sm font-medium text-[#b8c5d5] sm:inline">
            {getRoleName(session?.user?.role)}
          </span>
        </div>
      </div>
    </header>
  )
}
