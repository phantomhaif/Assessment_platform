import { prisma } from "@/lib/prisma"

type ResultEvent = NonNullable<Awaited<ReturnType<typeof loadEventResultsSource>>>

type TeamResult = {
  teamId: string
  teamName: string
  teamNumber: number | null
  members: ResultEvent["teams"][number]["members"]
  moduleScores: {
    code: string
    name: string
    nameEn: string | null
    score: number
    maxScore: number
  }[]
  skillGroupScores: {
    number: number
    name: string
    nameEn: string | null
    score: number
    maxScore: number
  }[]
  totalScore: number
  rank?: number
}

export async function loadEventResultsSource(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    include: {
      assessmentSchema: {
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              subCriteria: {
                include: {
                  criteria: true,
                },
              },
            },
          },
          skillGroups: {
            orderBy: { number: "asc" },
          },
        },
      },
      teams: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          scores: true,
        },
      },
    },
  })
}

export function computeEventResults(event: NonNullable<ResultEvent>): TeamResult[] {
  const schema = event.assessmentSchema
  if (!schema) {
    return []
  }

  const rawResults: TeamResult[] = event.teams.map((team) => {
    const teamScores = team.scores

    const moduleScores = schema.modules.map((module) => {
      const criterionIds = module.subCriteria.flatMap((subCriterion) =>
        subCriterion.criteria.map((criterion) => criterion.id)
      )
      const score = teamScores
        .filter((teamScore) => criterionIds.includes(teamScore.criterionId))
        .reduce((sum, teamScore) => sum + teamScore.value, 0)

      return {
        code: module.code,
        name: module.name,
        nameEn: module.nameEn,
        score,
        maxScore: module.maxScore,
      }
    })

    const skillGroupScores = schema.skillGroups.map((group) => {
      const criteriaInGroup = schema.modules.flatMap((module) =>
        module.subCriteria.flatMap((subCriterion) =>
          subCriterion.criteria.filter((criterion) => criterion.skillGroupId === group.id)
        )
      )

      const criterionIds = criteriaInGroup.map((criterion) => criterion.id)
      const score = teamScores
        .filter((teamScore) => criterionIds.includes(teamScore.criterionId))
        .reduce((sum, teamScore) => sum + teamScore.value, 0)

      return {
        number: group.number,
        name: group.name,
        nameEn: group.nameEn,
        score: Math.min(score, group.maxScore),
        maxScore: group.maxScore,
      }
    })

    const totalScore = moduleScores.reduce((sum, module) => sum + module.score, 0)

    return {
      teamId: team.id,
      teamName: team.name,
      teamNumber: team.number,
      members: team.members,
      moduleScores,
      skillGroupScores,
      totalScore,
    }
  })

  const ranked = [...rawResults].sort((a, b) => b.totalScore - a.totalScore)
  let currentRank = 1

  for (let index = 0; index < ranked.length; index += 1) {
    if (index > 0 && ranked[index].totalScore < ranked[index - 1].totalScore) {
      currentRank = index + 1
    }
    ranked[index].rank = currentRank
  }

  return ranked
}
