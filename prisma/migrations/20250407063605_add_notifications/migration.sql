/*
  Warnings:

  - You are about to drop the column `sourceId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `sourceType` on the `Notification` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Notification_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_isRead_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "sourceId",
DROP COLUMN "sourceType",
ADD COLUMN     "fromUserId" TEXT,
ADD COLUMN     "relatedId" TEXT;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
