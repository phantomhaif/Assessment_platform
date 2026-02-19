const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    // Delete the failed migration record
    await prisma.$executeRawUnsafe(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20260219000000_add_profile_fields'
    `)
    console.log('Successfully removed failed migration record')
  } catch (e) {
    console.log('Migration record not found or already removed:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
