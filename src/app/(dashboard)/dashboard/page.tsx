"use client"

import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, Users, Award, ClipboardList } from "lucide-react"
import { useI18n } from "@/lib/i18n/context"

export default function DashboardPage() {
  const { data: session } = useSession()
  const { t } = useI18n()
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "ORGANIZER"
  const isExpert = session?.user?.role === "EXPERT"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
        <p className="text-gray-500 mt-1">
          {isAdmin && t.dashboard.adminSubtitle}
          {isExpert && t.dashboard.expertSubtitle}
          {!isAdmin && !isExpert && t.dashboard.participantSubtitle}
        </p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.dashboard.eventsCount}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.dashboard.participantsCount}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <ClipboardList className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.dashboard.teamsCount}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Award className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{t.dashboard.passportsIssued}</p>
                  <p className="text-2xl font-bold">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isAdmin && !isExpert && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.myApplications}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">{t.dashboard.noActiveApplications}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.dashboard.myResults}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 text-sm">{t.dashboard.resultsWillAppear}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isExpert && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t.dashboard.assignedScores}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 text-sm">{t.dashboard.noAssignedTeams}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t.dashboard.upcomingEvents}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">{t.dashboard.noPlannedEvents}</p>
        </CardContent>
      </Card>
    </div>
  )
}
