-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Pensioner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pensionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "residentialAddress" TEXT NOT NULL,
    "pensionSchemeType" TEXT NOT NULL,
    "dateOfFirstAppointment" DATETIME NOT NULL,
    "dateOfRetirement" DATETIME NOT NULL,
    "pfNumber" TEXT NOT NULL,
    "lastPromotionDate" DATETIME NOT NULL,
    "currentLevel" TEXT NOT NULL,
    "salary" REAL NOT NULL,
    "expectedRetirementDate" DATETIME NOT NULL,
    "maidenName" TEXT,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pensionerId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    CONSTRAINT "Document_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "Pensioner" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_pensionId_key" ON "Pensioner"("pensionId");

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_nin_key" ON "Pensioner"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_email_key" ON "Pensioner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pensioner_pfNumber_key" ON "Pensioner"("pfNumber");
