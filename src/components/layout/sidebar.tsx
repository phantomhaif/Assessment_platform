"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/context"
import { getPlatformName } from "@/lib/brand"
import { BrandLockup } from "@/components/layout/brand-lockup"
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
  ChevronRight,
  Settings,
  Bell,
} from "lucide-react"

interface SidebarProps {
  userRole: string
  userName?: string
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ userRole, userName, className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const { t, locale } = useI18n()
  const platformName = getPlatformName(locale)

  const participantLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/events", label: t.nav.events, icon: Calendar },
    { href: "/rankings", label: locale === "ru" ? "Рейтинг" : "Rankings", icon: Award },
    { href: "/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/documents", label: t.nav.documents, icon: FileText },
    { href: "/submissions", label: locale === "ru" ? "Работы" : "Submissions", icon: Upload },
    { href: "/my-passports", label: t.nav.myPassports, icon: Award },
    { href: "/notifications", label: locale === "ru" ? "Уведомления" : "Notifications", icon: Bell },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ]

  const expertLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/scoring", label: t.nav.scoring, icon: ClipboardList },
    { href: "/rankings", label: locale === "ru" ? "Рейтинг" : "Rankings", icon: Award },
    { href: "/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/notifications", label: locale === "ru" ? "Уведомления" : "Notifications", icon: Bell },
    { href: "/profile", label: t.nav.profile, icon: UserCircle },
  ]

  const adminLinks = [
    { href: "/dashboard", label: t.nav.dashboard, icon: LayoutDashboard },
    { href: "/admin/events", label: t.nav.events, icon: Calendar },
    { href: "/admin/applications", label: t.nav.applications, icon: Inbox },
    { href: "/admin/teams", label: t.nav.teams, icon: Users },
    { href: "/rankings", label: locale === "ru" ? "Рейтинг" : "Rankings", icon: Award },
    { href: "/admin/scoring", label: t.nav.scoring, icon: ClipboardList },
    { href: "/admin/schemas", label: t.nav.schemas, icon: Upload },
    { href: "/admin/submissions", label: locale === "ru" ? "Работы команд" : "Team Submissions", icon: Upload },
    { href: "/admin/documents", label: t.nav.documents, icon: FileText },
    { href: "/admin/regulations", label: t.nav.regulations, icon: FileText },
    { href: "/admin/passports", label: t.nav.passports, icon: Award },
    { href: "/admin/users", label: t.nav.users, icon: Users },
    { href: "/admin/profile-fields", label: locale === "ru" ? "Поля профиля" : "Profile Fields", icon: Settings },
    { href: "/notifications", label: locale === "ru" ? "Уведомления" : "Notifications", icon: Bell },
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
      case "ADMIN":
        return t.roles.admin
      case "ORGANIZER":
        return t.roles.organizer
      case "EXPERT":
        return t.roles.expert
      case "PARTICIPANT":
        return t.roles.participant
      default:
        return t.roles.guest
    }
  }

  return (
    <aside className={cn("flex min-h-screen w-64 flex-col", className)} style={{ background: "var(--sidebar-background)" }}>
      <div className="border-b border-gray-200 p-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image src="/logo.png" alt="Industry Skills" width={52} height={52} className="flex-shrink-0" />
          <BrandLockup
            locale={locale}
            subtitle={platformName}
            className="h-[52px]"
            titleClassName="text-[14px]"
            subtitleClassName="max-w-[150px] text-[10px] leading-tight"
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href))

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-[#C41E3A] text-white shadow-lg shadow-red-500/20 hover:bg-[#a01830]"
                      : "text-[#94a3b8] hover:bg-gray-100 hover:text-[#C41E3A]"
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

      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C41E3A]/20">
            <UserCircle className="h-5 w-5 text-[#C41E3A]" />
          </div>
          <div className="min-w-0 flex-1">
            {userName && <p className="truncate text-sm font-medium text-white">{userName}</p>}
            <p className="text-xs text-[#64748b]">{getRoleName(userRole)}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#94a3b8] transition-all duration-200 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          {t.nav.logout}
        </button>
      </div>
    </aside>
  )
}
