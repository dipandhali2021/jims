-- DropIndex
DROP INDEX "Product_sku_key";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "costPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "ProductRequestDetails" ADD COLUMN     "costPrice" DOUBLE PRECISION;
