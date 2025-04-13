-- DropForeignKey
ALTER TABLE "SalesItem" DROP CONSTRAINT "SalesItem_productId_fkey";

-- AlterTable
ALTER TABLE "SalesItem" ADD COLUMN     "productName" TEXT,
ADD COLUMN     "productSku" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SalesItem" ADD CONSTRAINT "SalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
