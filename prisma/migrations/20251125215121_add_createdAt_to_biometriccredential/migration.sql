-- Add createdAt column to biometriccredential if it doesn't exist
-- This migration handles cases where:
-- 1. The column doesn't exist at all
-- 2. The column exists as registeredAt (rename it)
-- 3. The column already exists as createdAt (do nothing)

-- First, check if registeredAt exists and rename it if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'biometriccredential' 
    AND column_name = 'registeredAt'
  ) THEN
    ALTER TABLE "biometriccredential" RENAME COLUMN "registeredAt" TO "createdAt";
  END IF;
END $$;

-- Then, add createdAt if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'biometriccredential' 
    AND column_name = 'createdAt'
  ) THEN
    ALTER TABLE "biometriccredential" 
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

