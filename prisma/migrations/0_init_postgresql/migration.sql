-- PostgreSQL Migration Baseline
-- This migration creates all tables from the current schema

-- CreateTable: admin
CREATE TABLE "admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pensioner
CREATE TABLE "pensioner" (
    "id" SERIAL NOT NULL,
    "pensionId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nin" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "residentialAddress" TEXT NOT NULL,
    "pensionSchemeType" TEXT NOT NULL,
    "dateOfFirstAppointment" TIMESTAMP(3) NOT NULL,
    "dateOfRetirement" TIMESTAMP(3) NOT NULL,
    "pfNumber" TEXT NOT NULL,
    "lastPromotionDate" TIMESTAMP(3) NOT NULL,
    "currentLevel" TEXT NOT NULL,
    "salary" DOUBLE PRECISION NOT NULL,
    "maidenName" TEXT,
    "password" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gratuityRate" DOUBLE PRECISION,
    "monthlyPension" DOUBLE PRECISION,
    "pensionRate" DOUBLE PRECISION,
    "totalGratuity" DOUBLE PRECISION,
    "yearsOfService" INTEGER,
    "photo" TEXT,

    CONSTRAINT "pensioner_pkey" PRIMARY KEY ("id")
);

-- CreateTable: document
CREATE TABLE "document" (
    "id" TEXT NOT NULL,
    "pensionerId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "document_pkey" PRIMARY KEY ("id")
);

-- CreateTable: enquiry
CREATE TABLE "enquiry" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "trackingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "staffId" TEXT,
    "department" TEXT,
    "role" "user_role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable: pensionerfile
CREATE TABLE "pensionerfile" (
    "id" TEXT NOT NULL,
    "pensionerId" INTEGER NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "uploadedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pensionerfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verificationlog
CREATE TABLE "verificationlog" (
    "id" SERIAL NOT NULL,
    "pensionerId" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "nextDueAt" TIMESTAMP(3),

    CONSTRAINT "verificationlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verificationreview
CREATE TABLE "verificationreview" (
    "id" SERIAL NOT NULL,
    "pensionerId" INTEGER NOT NULL,
    "officerId" INTEGER,
    "capturedPhoto" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "verificationreview_pkey" PRIMARY KEY ("id")
);

-- CreateTable: biometriccredential
CREATE TABLE "biometriccredential" (
    "id" TEXT NOT NULL,
    "pensionerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "biometriccredential_pkey" PRIMARY KEY ("id")
);

-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('ADMIN', 'VERIFICATION_OFFICER');

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pensioner_pensionId_key" ON "pensioner"("pensionId");

-- CreateIndex
CREATE UNIQUE INDEX "pensioner_nin_key" ON "pensioner"("nin");

-- CreateIndex
CREATE UNIQUE INDEX "pensioner_email_key" ON "pensioner"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pensioner_pfNumber_key" ON "pensioner"("pfNumber");

-- CreateIndex
CREATE UNIQUE INDEX "enquiry_trackingId_key" ON "enquiry"("trackingId");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_staffId_key" ON "user"("staffId");

-- CreateIndex
CREATE INDEX "document_pensionerId_idx" ON "document"("pensionerId");

-- CreateIndex
CREATE INDEX "pensionerfile_pensionerId_idx" ON "pensionerfile"("pensionerId");

-- CreateIndex
CREATE INDEX "verificationlog_pensionerId_idx" ON "verificationlog"("pensionerId");

-- CreateIndex
CREATE INDEX "verificationreview_officerId_idx" ON "verificationreview"("officerId");

-- CreateIndex
CREATE INDEX "verificationreview_pensionerId_idx" ON "verificationreview"("pensionerId");

-- CreateIndex
CREATE INDEX "biometriccredential_pensionerId_idx" ON "biometriccredential"("pensionerId");

-- AddForeignKey
ALTER TABLE "document" ADD CONSTRAINT "Document_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "pensioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pensionerfile" ADD CONSTRAINT "PensionerFile_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "pensioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificationlog" ADD CONSTRAINT "VerificationLog_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "pensioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificationreview" ADD CONSTRAINT "VerificationReview_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verificationreview" ADD CONSTRAINT "VerificationReview_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "pensioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "biometriccredential" ADD CONSTRAINT "BiometricCredential_pensionerId_fkey" FOREIGN KEY ("pensionerId") REFERENCES "pensioner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

