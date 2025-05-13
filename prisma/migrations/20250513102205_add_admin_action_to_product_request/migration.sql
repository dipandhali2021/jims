-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
    "subscriptionEnds" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "supplier" TEXT,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "vyapariId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesItem" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "productSku" TEXT,
    "productImageUrl" TEXT,
    "salesRequestId" TEXT NOT NULL,

    CONSTRAINT "SalesItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Completed',
    "billType" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesAnalytics" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalRevenue" DOUBLE PRECISION NOT NULL,
    "totalOrders" INTEGER NOT NULL,
    "avgOrderValue" DOUBLE PRECISION NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "revenue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "adminAction" BOOLEAN NOT NULL DEFAULT false,
    "productId" TEXT,
    "userId" TEXT NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductRequestDetails" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "sku" TEXT,
    "description" TEXT,
    "category" TEXT,
    "material" TEXT,
    "price" DOUBLE PRECISION,
    "stock" INTEGER,
    "stockAdjustment" INTEGER,
    "imageUrl" TEXT,
    "supplier" TEXT,
    "requestId" TEXT NOT NULL,

    CONSTRAINT "ProductRequestDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "showGoogleSignIn" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bill" (
    "id" TEXT NOT NULL,
    "billNumber" TEXT NOT NULL,
    "billType" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOfSupply" TIMESTAMP(3),
    "timeOfSupply" TEXT,
    "customerName" TEXT NOT NULL,
    "customerAddress" TEXT,
    "customerState" TEXT,
    "customerGSTIN" TEXT,
    "items" JSONB NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "sgst" DOUBLE PRECISION,
    "cgst" DOUBLE PRECISION,
    "igst" DOUBLE PRECISION,
    "hsnCodes" JSONB,
    "transportMode" TEXT,
    "vehicleNo" TEXT,
    "placeOfSupply" TEXT,
    "isTaxable" BOOLEAN,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Bill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vyapari" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vyapari_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Karigar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "specialization" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Karigar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VyapariTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "vyapariId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "items" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VyapariTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarTransaction" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "items" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KarigarTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VyapariPayment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "vyapariId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VyapariPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KarigarPayment" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "karigarId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KarigarPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "SalesRequest_requestId_key" ON "SalesRequest"("requestId");

-- CreateIndex
CREATE INDEX "SalesRequest_vyapariId_idx" ON "SalesRequest"("vyapariId");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_orderId_key" ON "Transaction"("orderId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- CreateIndex
CREATE INDEX "Transaction_userId_idx" ON "Transaction"("userId");

-- CreateIndex
CREATE INDEX "Transaction_billType_idx" ON "Transaction"("billType");

-- CreateIndex
CREATE INDEX "SalesAnalytics_date_idx" ON "SalesAnalytics"("date");

-- CreateIndex
CREATE INDEX "SalesAnalytics_category_idx" ON "SalesAnalytics"("category");

-- CreateIndex
CREATE INDEX "SalesAnalytics_productId_idx" ON "SalesAnalytics"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRequest_requestId_key" ON "ProductRequest"("requestId");

-- CreateIndex
CREATE INDEX "ProductRequest_userId_idx" ON "ProductRequest"("userId");

-- CreateIndex
CREATE INDEX "ProductRequest_status_idx" ON "ProductRequest"("status");

-- CreateIndex
CREATE INDEX "ProductRequest_requestType_idx" ON "ProductRequest"("requestType");

-- CreateIndex
CREATE UNIQUE INDEX "ProductRequestDetails_requestId_key" ON "ProductRequestDetails"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Bill_billNumber_key" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_billNumber_idx" ON "Bill"("billNumber");

-- CreateIndex
CREATE INDEX "Bill_createdAt_idx" ON "Bill"("createdAt");

-- CreateIndex
CREATE INDEX "Bill_userId_idx" ON "Bill"("userId");

-- CreateIndex
CREATE INDEX "Vyapari_name_idx" ON "Vyapari"("name");

-- CreateIndex
CREATE INDEX "Vyapari_status_idx" ON "Vyapari"("status");

-- CreateIndex
CREATE INDEX "Vyapari_isApproved_idx" ON "Vyapari"("isApproved");

-- CreateIndex
CREATE INDEX "Karigar_name_idx" ON "Karigar"("name");

-- CreateIndex
CREATE INDEX "Karigar_status_idx" ON "Karigar"("status");

-- CreateIndex
CREATE INDEX "Karigar_isApproved_idx" ON "Karigar"("isApproved");

-- CreateIndex
CREATE UNIQUE INDEX "VyapariTransaction_transactionId_key" ON "VyapariTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "VyapariTransaction_vyapariId_idx" ON "VyapariTransaction"("vyapariId");

-- CreateIndex
CREATE INDEX "VyapariTransaction_createdById_idx" ON "VyapariTransaction"("createdById");

-- CreateIndex
CREATE INDEX "VyapariTransaction_createdAt_idx" ON "VyapariTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KarigarTransaction_transactionId_key" ON "KarigarTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "KarigarTransaction_karigarId_idx" ON "KarigarTransaction"("karigarId");

-- CreateIndex
CREATE INDEX "KarigarTransaction_createdById_idx" ON "KarigarTransaction"("createdById");

-- CreateIndex
CREATE INDEX "KarigarTransaction_createdAt_idx" ON "KarigarTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VyapariPayment_paymentId_key" ON "VyapariPayment"("paymentId");

-- CreateIndex
CREATE INDEX "VyapariPayment_vyapariId_idx" ON "VyapariPayment"("vyapariId");

-- CreateIndex
CREATE INDEX "VyapariPayment_createdById_idx" ON "VyapariPayment"("createdById");

-- CreateIndex
CREATE INDEX "VyapariPayment_createdAt_idx" ON "VyapariPayment"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KarigarPayment_paymentId_key" ON "KarigarPayment"("paymentId");

-- CreateIndex
CREATE INDEX "KarigarPayment_karigarId_idx" ON "KarigarPayment"("karigarId");

-- CreateIndex
CREATE INDEX "KarigarPayment_createdById_idx" ON "KarigarPayment"("createdById");

-- CreateIndex
CREATE INDEX "KarigarPayment_createdAt_idx" ON "KarigarPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesRequest" ADD CONSTRAINT "SalesRequest_vyapariId_fkey" FOREIGN KEY ("vyapariId") REFERENCES "Vyapari"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesItem" ADD CONSTRAINT "SalesItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesItem" ADD CONSTRAINT "SalesItem_salesRequestId_fkey" FOREIGN KEY ("salesRequestId") REFERENCES "SalesRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequest" ADD CONSTRAINT "ProductRequest_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequest" ADD CONSTRAINT "ProductRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductRequestDetails" ADD CONSTRAINT "ProductRequestDetails_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ProductRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bill" ADD CONSTRAINT "Bill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vyapari" ADD CONSTRAINT "Vyapari_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vyapari" ADD CONSTRAINT "Vyapari_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Karigar" ADD CONSTRAINT "Karigar_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Karigar" ADD CONSTRAINT "Karigar_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VyapariTransaction" ADD CONSTRAINT "VyapariTransaction_vyapariId_fkey" FOREIGN KEY ("vyapariId") REFERENCES "Vyapari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VyapariTransaction" ADD CONSTRAINT "VyapariTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarTransaction" ADD CONSTRAINT "KarigarTransaction_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarTransaction" ADD CONSTRAINT "KarigarTransaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VyapariPayment" ADD CONSTRAINT "VyapariPayment_vyapariId_fkey" FOREIGN KEY ("vyapariId") REFERENCES "Vyapari"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VyapariPayment" ADD CONSTRAINT "VyapariPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarPayment" ADD CONSTRAINT "KarigarPayment_karigarId_fkey" FOREIGN KEY ("karigarId") REFERENCES "Karigar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KarigarPayment" ADD CONSTRAINT "KarigarPayment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
