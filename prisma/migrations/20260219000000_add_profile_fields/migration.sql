-- CreateEnum
CREATE TYPE "ProfileFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'SELECT', 'DATE');

-- CreateTable
CREATE TABLE "profile_fields" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" "ProfileFieldType" NOT NULL DEFAULT 'TEXT',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "optionsEn" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile_field_values" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "profile_field_values_userId_fieldId_key" ON "profile_field_values"("userId", "fieldId");

-- AddForeignKey
ALTER TABLE "profile_field_values" ADD CONSTRAINT "profile_field_values_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile_field_values" ADD CONSTRAINT "profile_field_values_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "profile_fields"("id") ON DELETE CASCADE ON UPDATE CASCADE;
