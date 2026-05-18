import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.user.findMany({
    where: {
      organization: {
        not: null,
      },
    },
    select: {
      id: true,
      organization: true,
      organizationId: true,
    },
  })

  let updated = 0

  for (const user of users) {
    const name = user.organization?.trim()
    if (!name || user.organizationId) continue

    const organization = await prisma.organization.upsert({
      where: { name },
      create: {
        name,
        isApproved: true,
      },
      update: {},
      select: { id: true },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { organizationId: organization.id },
    })
    updated += 1
  }

  console.log(`Backfilled organization links for ${updated} users`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
