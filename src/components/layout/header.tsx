"use client"

import { useSession } from "next-auth/react"
import { Bell, User } from "lucide-react"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Добро пожаловать, {session?.user?.name}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {session?.user?.role === "ADMIN" && "Администратор"}
            {session?.user?.role === "ORGANIZER" && "Организатор"}
            {session?.user?.role === "EXPERT" && "Эксперт"}
            {session?.user?.role === "PARTICIPANT" && "Участник"}
          </span>
        </div>
      </div>
    </header>
  )
}
