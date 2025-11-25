-- Alter the biometriccredential primary key to use an autoincrementing integer
ALTER TABLE "biometriccredential" DROP CONSTRAINT IF EXISTS "biometriccredential_pkey";
ALTER TABLE "biometriccredential" RENAME COLUMN "id" TO "legacy_id";
ALTER TABLE "biometriccredential"
  ADD COLUMN "id" SERIAL;
ALTER TABLE "biometriccredential"
  ADD CONSTRAINT "biometriccredential_pkey" PRIMARY KEY ("id");
ALTER TABLE "biometriccredential" DROP COLUMN "legacy_id";

-- Rename timestamp column to createdAt for clarity
ALTER TABLE "biometriccredential" RENAME COLUMN "registeredAt" TO "createdAt";

