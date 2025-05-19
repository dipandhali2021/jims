-- AlterTable
ALTER TABLE "KarigarDeleteRequest" ADD COLUMN     "approvedById" TEXT;

-- AlterTable
ALTER TABLE "VyapariDeleteRequest" ADD COLUMN     "approvedById" TEXT;

-- AddForeignKey
ALTER TABLE "VyapariDeleteRequest" ADD CONSTRAINT "VyapariDeleteRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarDeleteRequest" ADD CONSTRAINT "KarigarDeleteRequest_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
