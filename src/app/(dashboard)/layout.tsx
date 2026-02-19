"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { WaveDots } from "@/components/ui/wave-dots"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()

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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={session.user.role} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 relative overflow-hidden">
          <WaveDots className="absolute top-0 right-0 w-2/5 h-2/5 pointer-events-none opacity-40" />
          <WaveDots className="absolute bottom-0 left-0 w-2/5 h-2/5 pointer-events-none opacity-40" />
          <div className="relative">{children}</div>
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
