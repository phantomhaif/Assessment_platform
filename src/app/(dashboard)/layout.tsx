"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { WaveDots } from "@/components/ui/wave-dots"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="app-grid-bg flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="app-shell app-grid-bg overflow-x-hidden text-[#dce4f0]">
      <div className="hidden md:block md:shrink-0">
        <Sidebar userRole={session.user.role} userName={session.user.name || undefined} />
      </div>

      {isMobileSidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-out md:hidden ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar
          userRole={session.user.role}
          userName={session.user.name || undefined}
          className="shadow-xl"
          onNavigate={() => setIsMobileSidebarOpen(false)}
        />
      </div>

      <div className="app-main">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="page-content page-grid">
          <div className="scan" />
          <div className="orb orb-a opacity-35" />
          <div className="orb orb-b opacity-25" />
          <WaveDots color="rgba(196,30,58,0.52)" className="pointer-events-none absolute right-0 top-0 h-2/5 w-2/5 opacity-20" />
          <WaveDots color="rgba(96,165,250,0.38)" className="pointer-events-none absolute bottom-0 left-0 h-2/5 w-2/5 opacity-15" />
          <div className="relative min-w-0">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  )
}
