-- CreateTable (if not exists)
CREATE TABLE IF NOT EXISTS "protocol_assignments" (
    "id" TEXT NOT NULL,
    "protocolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "protocol_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (if not exists)
CREATE UNIQUE INDEX IF NOT EXISTS "protocol_assignments_protocolId_userId_key" ON "protocol_assignments"("protocolId", "userId");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocol_assignments_protocolId_fkey') THEN
        ALTER TABLE "protocol_assignments" ADD CONSTRAINT "protocol_assignments_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "protocols"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'protocol_assignments_userId_fkey') THEN
        ALTER TABLE "protocol_assignments" ADD CONSTRAINT "protocol_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Remove targetRole column from protocols if it exists (schema changed)
ALTER TABLE "protocols" DROP COLUMN IF EXISTS "targetRole";
