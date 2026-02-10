-- One unit = one property: merge Unit into Property, remove unitId from Lease/Cheque/Payment

-- Add unit-level fields to Property
ALTER TABLE "Property" ADD COLUMN "unitNo" TEXT;
ALTER TABLE "Property" ADD COLUMN "bedrooms" INTEGER;
ALTER TABLE "Property" ADD COLUMN "status" "UnitStatus" DEFAULT 'VACANT';

-- Lease: drop unitId and its FK/index; add index on propertyId for overlap checks
ALTER TABLE "Lease" DROP CONSTRAINT IF EXISTS "Lease_unitId_fkey";
DROP INDEX IF EXISTS "Lease_unitId_startDate_endDate_idx";
ALTER TABLE "Lease" DROP COLUMN "unitId";
CREATE INDEX "Lease_propertyId_startDate_endDate_idx" ON "Lease"("propertyId", "startDate", "endDate");

-- Cheque: drop unitId and its FK
ALTER TABLE "Cheque" DROP CONSTRAINT IF EXISTS "Cheque_unitId_fkey";
ALTER TABLE "Cheque" DROP COLUMN "unitId";

-- Payment: drop unitId and its FK
ALTER TABLE "Payment" DROP CONSTRAINT IF EXISTS "Payment_unitId_fkey";
ALTER TABLE "Payment" DROP COLUMN "unitId";

-- Drop Unit table
DROP TABLE "Unit";
