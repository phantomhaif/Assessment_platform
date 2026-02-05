import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPassword,
      firstName: "Администратор",
      lastName: "Системы",
      role: "ADMIN",
      agreedToTerms: true,
      agreedToDataProcessing: true,
    },
  })

  console.log("Created admin user:", admin.email)

  // Create test participant
  const userPassword = await bcrypt.hash("user123", 12)
  const user = await prisma.user.upsert({
    where: { email: "user@example.com" },
    update: {},
    create: {
      email: "user@example.com",
      passwordHash: userPassword,
      firstName: "Иван",
      lastName: "Иванов",
      middleName: "Иванович",
      organization: "МИРЭА — Российский технологический университет",
      role: "PARTICIPANT",
      agreedToTerms: true,
      agreedToDataProcessing: true,
    },
  })

  console.log("Created test user:", user.email)

  // Create test expert
  const expertPassword = await bcrypt.hash("expert123", 12)
  const expert = await prisma.user.upsert({
    where: { email: "expert@example.com" },
    update: {},
    create: {
      email: "expert@example.com",
      passwordHash: expertPassword,
      firstName: "Эксперт",
      lastName: "Тестовый",
      role: "EXPERT",
      agreedToTerms: true,
      agreedToDataProcessing: true,
    },
  })

  console.log("Created test expert:", expert.email)

  // Create test event
  const now = new Date()
  const event = await prisma.event.upsert({
    where: { id: "test-event-1" },
    update: {},
    create: {
      id: "test-event-1",
      name: "Международный Чемпионат Robotics Skills 2025",
      description: "Соревнования по робототехнике и цифровому производству",
      competency: "Цифровое производство",
      registrationStart: now,
      registrationEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
      eventStart: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // +60 days
      eventEnd: new Date(now.getTime() + 63 * 24 * 60 * 60 * 1000), // +63 days
      status: "REGISTRATION_OPEN",
      maxTeamSize: 4,
      minTeamSize: 1,
    },
  })

  console.log("Created test event:", event.name)

  console.log("\n--- Test accounts ---")
  console.log("Admin: admin@example.com / admin123")
  console.log("User: user@example.com / user123")
  console.log("Expert: expert@example.com / expert123")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
