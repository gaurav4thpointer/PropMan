-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "UserRole" ADD VALUE 'PROPERTY_MANAGER';
ALTER TYPE "UserRole" ADD VALUE 'AGENT';

-- CreateTable
CREATE TABLE "PropertyManager" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedById" TEXT,

    CONSTRAINT "PropertyManager_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerAgent" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerAgent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropertyManager_propertyId_userId_key" ON "PropertyManager"("propertyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerAgent_agentId_key" ON "ManagerAgent"("agentId");

-- AddForeignKey
ALTER TABLE "PropertyManager" ADD CONSTRAINT "PropertyManager_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManager" ADD CONSTRAINT "PropertyManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyManager" ADD CONSTRAINT "PropertyManager_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerAgent" ADD CONSTRAINT "ManagerAgent_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerAgent" ADD CONSTRAINT "ManagerAgent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
