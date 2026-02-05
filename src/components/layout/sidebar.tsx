"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Award,
  LogOut,
  ClipboardList,
  Upload,
  UserCircle,
  Inbox,
  ChevronRight
} from "lucide-react"

interface SidebarProps {
  userRole: string
  userName?: string
}

export function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()

  const participantLinks = [
    { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
    { href: "/events", label: "Мероприятия", icon: Calendar },
    { href: "/my-passports", label: "Мои паспорта", icon: Award },
    { href: "/profile", label: "Профиль", icon: UserCircle },
  ]

  const expertLinks = [
    { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
    { href: "/scoring", label: "Оценивание", icon: ClipboardList },
    { href: "/profile", label: "Профиль", icon: UserCircle },
  ]

  const adminLinks = [
    { href: "/dashboard", label: "Главная", icon: LayoutDashboard },
    { href: "/admin/events", label: "Мероприятия", icon: Calendar },
    { href: "/admin/applications", label: "Заявки", icon: Inbox },
    { href: "/admin/teams", label: "Команды", icon: Users },
    { href: "/admin/scoring", label: "Оценивание", icon: ClipboardList },
    { href: "/admin/schemas", label: "Схемы оценки", icon: Upload },
    { href: "/admin/documents", label: "Документы", icon: FileText },
    { href: "/admin/passports", label: "Паспорта", icon: Award },
    { href: "/admin/users", label: "Пользователи", icon: Users },
    { href: "/profile", label: "Профиль", icon: UserCircle },
  ]

  const links =
    userRole === "ADMIN" || userRole === "ORGANIZER"
      ? adminLinks
      : userRole === "EXPERT"
      ? expertLinks
      : participantLinks

  const getRoleName = (role: string) => {
    const roleNames: Record<string, string> = {
      ADMIN: "Администратор",
      ORGANIZER: "Организатор",
      EXPERT: "Эксперт",
      PARTICIPANT: "Участник",
    }
    return roleNames[role] || role
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: 'var(--sidebar-background)' }}>
      {/* Logo section */}
      <div className="p-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#0066cc] flex items-center justify-center">
            <span className="text-white font-bold text-lg">IS</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">Industry Skills</h1>
            <p className="text-[#64748b] text-xs">Платформа оценивания</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href ||
              (link.href !== "/dashboard" && pathname.startsWith(link.href))

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#0066cc] text-white shadow-lg shadow-blue-500/20"
                      : "text-[#94a3b8] hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1">{link.label}</span>
                  {isActive && <ChevronRight className="h-4 w-4" />}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-3">
          <div className="w-9 h-9 rounded-full bg-[#0066cc]/20 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-[#0066cc]" />
          </div>
          <div className="flex-1 min-w-0">
            {userName && (
              <p className="text-white text-sm font-medium truncate">{userName}</p>
            )}
            <p className="text-[#64748b] text-xs">{getRoleName(userRole)}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all duration-200"
        >
          <LogOut className="h-5 w-5" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
