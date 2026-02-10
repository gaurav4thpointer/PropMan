-- DropTable (ManagerAgent references User)
DROP TABLE "ManagerAgent";

-- DropTable (PropertyManager references Property and User)
DROP TABLE "PropertyManager";

-- Downgrade any PROPERTY_MANAGER/AGENT users to USER before changing enum
UPDATE "User" SET role = 'USER' WHERE role IN ('PROPERTY_MANAGER', 'AGENT');

-- Create new enum with only USER and SUPER_ADMIN
CREATE TYPE "UserRole_new" AS ENUM ('USER', 'SUPER_ADMIN');

-- AlterTable: switch column to new enum
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'USER'::"UserRole_new";

-- Drop old enum and rename new
DROP TYPE "UserRole";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
