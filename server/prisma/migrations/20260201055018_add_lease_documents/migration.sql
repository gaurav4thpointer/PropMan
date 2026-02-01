-- CreateTable
CREATE TABLE "LeaseDocument" (
    "id" TEXT NOT NULL,
    "leaseId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedPath" TEXT NOT NULL,
    "mimeType" TEXT,
    "size" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeaseDocument_leaseId_idx" ON "LeaseDocument"("leaseId");

-- AddForeignKey
ALTER TABLE "LeaseDocument" ADD CONSTRAINT "LeaseDocument_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "Lease"("id") ON DELETE CASCADE ON UPDATE CASCADE;
