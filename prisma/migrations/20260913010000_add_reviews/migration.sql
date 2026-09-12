CREATE TABLE "Review" (
 "id" TEXT NOT NULL PRIMARY KEY,
 "productId" TEXT NOT NULL,
 "patronId" TEXT NOT NULL,
 "rating" INTEGER NOT NULL CHECK ("rating" BETWEEN 1 AND 5),
 "text" TEXT NOT NULL,
 "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "updatedAt" DATETIME NOT NULL,
 CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
 CONSTRAINT "Review_patronId_fkey" FOREIGN KEY ("patronId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Review_productId_patronId_key" ON "Review"("productId", "patronId");
CREATE INDEX "Review_productId_createdAt_idx" ON "Review"("productId", "createdAt");
