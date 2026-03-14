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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
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

      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <main className="flex-1 p-3 md:p-6 relative min-w-0">
          <WaveDots className="absolute top-0 right-0 w-2/5 h-2/5 pointer-events-none opacity-40" />
          <WaveDots className="absolute bottom-0 left-0 w-2/5 h-2/5 pointer-events-none opacity-40" />
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
