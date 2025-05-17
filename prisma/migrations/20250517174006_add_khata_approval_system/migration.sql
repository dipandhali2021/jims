-- AlterTable
ALTER TABLE "KarigarPayment" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "KarigarTransaction" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VyapariPayment" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "VyapariTransaction" ADD COLUMN     "approvedById" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "KarigarPayment_isApproved_idx" ON "KarigarPayment"("isApproved");

-- CreateIndex
CREATE INDEX "KarigarTransaction_isApproved_idx" ON "KarigarTransaction"("isApproved");

-- CreateIndex
CREATE INDEX "VyapariPayment_isApproved_idx" ON "VyapariPayment"("isApproved");

-- CreateIndex
CREATE INDEX "VyapariTransaction_isApproved_idx" ON "VyapariTransaction"("isApproved");

-- AddForeignKey
ALTER TABLE "VyapariTransaction" ADD CONSTRAINT "VyapariTransaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarTransaction" ADD CONSTRAINT "KarigarTransaction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VyapariPayment" ADD CONSTRAINT "VyapariPayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarPayment" ADD CONSTRAINT "KarigarPayment_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
