-- CreateTable
CREATE TABLE `Admin` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'admin',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Admin_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Pensioner` (
    `id` VARCHAR(191) NOT NULL,
    `pensionId` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `nin` VARCHAR(191) NOT NULL,
    `dateOfBirth` DATETIME(3) NOT NULL,
    `gender` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `residentialAddress` VARCHAR(191) NOT NULL,
    `pensionSchemeType` VARCHAR(191) NOT NULL,
    `dateOfFirstAppointment` DATETIME(3) NOT NULL,
    `dateOfRetirement` DATETIME(3) NOT NULL,
    `pfNumber` VARCHAR(191) NOT NULL,
    `lastPromotionDate` DATETIME(3) NOT NULL,
    `currentLevel` VARCHAR(191) NOT NULL,
    `salary` DOUBLE NOT NULL,
    `expectedRetirementDate` DATETIME(3) NOT NULL,
    `maidenName` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING_VERIFICATION',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `gratuityRate` DOUBLE NULL,
    `monthlyPension` DOUBLE NULL,
    `pensionRate` DOUBLE NULL,
    `totalGratuity` DOUBLE NULL,
    `yearsOfService` INTEGER NULL,

    UNIQUE INDEX `Pensioner_pensionId_key`(`pensionId`),
    UNIQUE INDEX `Pensioner_nin_key`(`nin`),
    UNIQUE INDEX `Pensioner_email_key`(`email`),
    UNIQUE INDEX `Pensioner_pfNumber_key`(`pfNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Document` (
    `id` VARCHAR(191) NOT NULL,
    `pensionerId` VARCHAR(191) NOT NULL,
    `documentType` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedAt` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Document` ADD CONSTRAINT `Document_pensionerId_fkey` FOREIGN KEY (`pensionerId`) REFERENCES `Pensioner`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
