"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
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
  const { t, locale } = useI18n()

  const participantLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/events", label: t.nav.events, icon: Calendar },
    { href: "/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/my-passports", label: t.nav.myPassports, icon: Award },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ]

  const expertLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/scoring", label: t.nav.scoring, icon: ClipboardList },
    { href: "/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ]

  const adminLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/events", label: t.nav.events, icon: Calendar },
    { href: "/admin/applications", label: t.nav.applications, icon: Inbox },
    { href: "/admin/teams", label: t.nav.teams, icon: Users },
    { href: "/admin/scoring", label: t.nav.scoring, icon: ClipboardList },
    { href: "/admin/schemas", label: t.nav.schemas, icon: Upload },
    { href: "/admin/documents", label: t.nav.documents, icon: FileText },
    { href: "/admin/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/admin/passports", label: t.nav.passports, icon: Award },
    { href: "/admin/users", label: t.nav.users, icon: Users },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ]

  const links =
    userRole === "ADMIN" || userRole === "ORGANIZER"
      ? adminLinks
      : userRole === "EXPERT"
      ? expertLinks
      : participantLinks

  const getRoleName = (role: string) => {
    switch (role) {
      case "ADMIN": return t.roles.admin
      case "ORGANIZER": return t.roles.organizer
      case "EXPERT": return t.roles.expert
      case "PARTICIPANT": return t.roles.participant
      default: return t.roles.guest
    }
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: 'var(--sidebar-background)' }}>
      {/* Logo section */}
      <div className="p-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#C41E3A] flex items-center justify-center">
            <span className="text-white font-bold text-lg">IS</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-lg leading-tight">Industry Skills</h1>
            <p className="text-[#64748b] text-xs">{locale === "ru" ? "Платформа оценивания" : "Assessment Platform"}</p>
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
                      ? "bg-[#C41E3A] text-white shadow-lg shadow-red-500/20 hover:bg-[#a01830]"
                      : "text-[#94a3b8] hover:text-[#C41E3A] hover:bg-gray-100"
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
          <div className="w-9 h-9 rounded-full bg-[#C41E3A]/20 flex items-center justify-center">
            <UserCircle className="h-5 w-5 text-[#C41E3A]" />
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
          {t.nav.logout}
        </button>
      </div>
    </aside>
  )
}
