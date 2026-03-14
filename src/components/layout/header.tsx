"use client"

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

  const getRoleName = (role: string | undefined) => {
    switch (role) {
      case "ADMIN": return t.roles.admin
      case "ORGANIZER": return t.roles.organizer
      case "EXPERT": return t.roles.expert
      case "PARTICIPANT": return t.roles.participant
      default: return t.roles.guest
    }
  }

  const greeting = locale === "ru"
    ? `Добро пожаловать, ${session?.user?.name}`
    : `Welcome, ${session?.user?.name}`

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
        <h2 className="truncate text-xs font-semibold text-gray-900 sm:text-sm md:text-lg">
          {greeting}
        </h2>
      </div>

      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <LanguageSwitcher />
        <button className="hidden sm:inline-flex p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
        </button>
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
