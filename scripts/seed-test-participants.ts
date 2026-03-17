import bcrypt from "bcryptjs"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const PASSWORD = "TeamTest123!"

const TEAMS = [
  { organization: "ООО Альфа Тех", slug: "alpha", city: "Москва" },
  { organization: "ООО Бета Индастри", slug: "beta", city: "Санкт-Петербург" },
  { organization: "ООО Гамма Роботикс", slug: "gamma", city: "Казань" },
  { organization: "ООО Дельта Автомейшн", slug: "delta", city: "Екатеринбург" },
  { organization: "ООО Сигма Диджитал", slug: "sigma", city: "Новосибирск" },
] as const

const FIRST_NAMES = ["Иван", "Мария", "Алексей", "Елена"] as const
const LAST_NAMES = ["Соколов", "Петрова", "Кузнецов", "Иванова"] as const
const MIDDLE_NAMES = ["Андреевич", "Сергеевна", "Игоревич", "Викторовна"] as const

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12)
  const created: Array<{ email: string; password: string; organization: string; fullName: string }> = []

  for (let teamIndex = 0; teamIndex < TEAMS.length; teamIndex += 1) {
    const team = TEAMS[teamIndex]

    for (let memberIndex = 0; memberIndex < 4; memberIndex += 1) {
      const email = `${team.slug}${memberIndex + 1}@industryskills.test`
      const firstName = FIRST_NAMES[memberIndex]
      const lastName = LAST_NAMES[memberIndex]
      const middleName = MIDDLE_NAMES[memberIndex]

      await prisma.user.upsert({
        where: { email },
        update: {
          passwordHash,
          firstName,
          lastName,
          middleName,
          organization: team.organization,
          position: `Участник, ${team.city}`,
          role: "PARTICIPANT",
          agreedToTerms: true,
          agreedToDataProcessing: true,
          emailVerified: new Date(),
        },
        create: {
          email,
          passwordHash,
          firstName,
          lastName,
          middleName,
          organization: team.organization,
          position: `Участник, ${team.city}`,
          role: "PARTICIPANT",
          agreedToTerms: true,
          agreedToDataProcessing: true,
          emailVerified: new Date(),
        },
      })

      created.push({
        email,
        password: PASSWORD,
        organization: team.organization,
        fullName: `${lastName} ${firstName} ${middleName}`,
      })
    }
  }

  console.log("Created or updated test participants:")
  for (const user of created) {
    console.log(`${user.email} | ${user.password} | ${user.organization} | ${user.fullName}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
