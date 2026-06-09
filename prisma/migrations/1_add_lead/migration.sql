-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "source" TEXT NOT NULL DEFAULT 'meta',
    "leadgenId" TEXT,
    "formId" TEXT,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "nextEmailAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active',
    "unsubToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_unsubToken_key" ON "Lead"("unsubToken");

-- CreateIndex
CREATE INDEX "Lead_status_nextEmailAt_idx" ON "Lead"("status", "nextEmailAt");

-- CreateIndex
CREATE INDEX "Lead_leadgenId_idx" ON "Lead"("leadgenId");
