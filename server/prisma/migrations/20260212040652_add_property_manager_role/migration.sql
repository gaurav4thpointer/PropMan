-- CreateEnum
CREATE TYPE "ManagerOwnerStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'PROPERTY_MANAGER';

-- CreateTable
CREATE TABLE "ManagerOwner" (
    "id" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" "ManagerOwnerStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManagerOwner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedProperty" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "ManagedProperty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ManagerOwner_ownerId_idx" ON "ManagerOwner"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerOwner_managerId_ownerId_key" ON "ManagerOwner"("managerId", "ownerId");

-- CreateIndex
CREATE INDEX "ManagedProperty_managerId_idx" ON "ManagedProperty"("managerId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedProperty_propertyId_managerId_key" ON "ManagedProperty"("propertyId", "managerId");

-- AddForeignKey
ALTER TABLE "ManagerOwner" ADD CONSTRAINT "ManagerOwner_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerOwner" ADD CONSTRAINT "ManagerOwner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedProperty" ADD CONSTRAINT "ManagedProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedProperty" ADD CONSTRAINT "ManagedProperty_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
