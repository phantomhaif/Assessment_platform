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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <h2 className="text-sm md:text-lg font-semibold text-gray-900 truncate">
          {greeting}
        </h2>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
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
