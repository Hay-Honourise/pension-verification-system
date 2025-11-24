-- AlterTable
ALTER TABLE "pensioner" ADD COLUMN     "hasSeenDueNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextDueAt" TIMESTAMP(3);
