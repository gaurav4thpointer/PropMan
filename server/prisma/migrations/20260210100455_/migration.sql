-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Country" ADD VALUE 'US';
ALTER TYPE "Country" ADD VALUE 'GB';
ALTER TYPE "Country" ADD VALUE 'SG';
ALTER TYPE "Country" ADD VALUE 'SA';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Currency" ADD VALUE 'USD';
ALTER TYPE "Currency" ADD VALUE 'GBP';
ALTER TYPE "Currency" ADD VALUE 'SGD';
ALTER TYPE "Currency" ADD VALUE 'SAR';

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabledCountries" TEXT[],
    "enabledCurrencies" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
