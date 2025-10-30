# Production Database Migration Setup Guide

This guide will help you migrate your database to production on Vercel.

## ⚠️ **Important Notice**

Your current migrations are **out of sync** with your Prisma schema. The migrations use `VARCHAR(191)` IDs for `Pensioner`, `Admin`, `Document`, and `User` models, but your current schema expects `Int` for several of these models.

## Current Schema vs Migration Mismatch

### Models with ID type conflicts:
1. **Pensioner**: Migration uses `VARCHAR(191)`, Schema expects `Int`
2. **Admin**: Migration uses `VARCHAR(191)`, Schema expects `String` ✅
3. **Document**: Migration uses `VARCHAR(191)`, Schema expects `String` ✅
4. **User**: Migration uses `VARCHAR(191)`, Schema expects `Int`
5. **pensionerfile**: Missing in migrations
6. **verificationlog**: Missing in migrations
7. **verificationreview**: Missing in migrations
8. **biometriccredential**: Missing in migrations

## Solution: Create New Production Migration

You need to create a fresh migration that matches your current schema. Here are two approaches:

### **Option 1: Use Prisma Migrate Deploy (Recommended for Production)**

This applies pending migrations to your production database:

```bash
# Generate Prisma Client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy
```

### **Option 2: Reset and Create New Migration (⚠️ Destructive - Use with Caution)**

This approach creates a completely new migration from your current schema:

```bash
# Reset the migration history and create a new baseline
npx prisma migrate reset

# Create a new migration
npx prisma migrate dev --name production_baseline

# Apply to production
npx prisma migrate deploy
```

⚠️ **Warning**: `migrate reset` will **DELETE ALL DATA** in your database!

## Database Setup on Vercel

### Step 1: Set Up Production Database

You need a production MySQL database. Popular options:

1. **PlanetScale** (Recommended for Vercel)
   - Visit: https://planetscale.com
   - Create a new database
   - Copy the connection string

2. **AWS RDS** (MySQL)
   - Set up an RDS MySQL instance
   - Get the connection string

3. **Railway**
   - Visit: https://railway.app
   - Create a MySQL database
   - Copy the connection string

### Step 2: Configure Environment Variables on Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```env
DATABASE_URL="mysql://username:password@host:port/database_name?schema=public"
JWT_SECRET="your-super-secret-jwt-key-here-make-it-long-and-random"
B2_KEY_ID="your_backblaze_key_id"
B2_APPLICATION_KEY="your_backblaze_application_key"
B2_BUCKET_ID="your_bucket_id"
B2_BUCKET_NAME="your_bucket_name"
```

### Step 3: Deploy to Vercel

The build process is now configured to automatically:
1. Install dependencies
2. Generate Prisma Client (`postinstall` script)
3. Run migrations (`build:prod` script)
4. Build the Next.js app

Just push to your repository or click "Deploy" on Vercel.

## Migration Files Overview

Current migration files in `prisma/migrations/`:

```
20250906151145_init/              # Initial schema (VARCHAR IDs)
20250908160017_add_user_model/    # User table (VARCHAR ID)  
20250909093213_add_staff_user/    # Modifies User to INT ID
20250909120824_add_enquiry_model/ # Enquiry table
20250915083751_add_pensioner_photo/ # Adds photo field
```

## Missing Models in Migrations

These models exist in your schema but have NO migrations:
- `pensionerfile`
- `verificationlog`
- `verificationreview`
- `biometriccredential`

These need to be added to migrations for production!

## Recommended Action Plan

### For Fresh Production Database (No Existing Data):

1. **Create a complete new migration** that includes ALL your current models:
   ```bash
   npx prisma migrate dev --name complete_schema
   ```

2. **Add the missing models** to the migration if needed

3. **Deploy to production**:
   ```bash
   npx prisma migrate deploy
   ```

### For Existing Production Database (Has Data):

1. **Create a migration to alter existing tables**:
   ```bash
   npx prisma migrate dev --name alter_to_int_ids
   ```

2. **Review the generated migration** carefully

3. **Apply to production**:
   ```bash
   npx prisma migrate deploy
   ```

## Testing Your Database Connection

After setting up environment variables on Vercel, you can test the connection:

```bash
# Check migration status
npx prisma migrate status

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to view data
npx prisma studio
```

## Troubleshooting

### Build Fails with "Prisma Client Generation Error"

✅ Already fixed! The `postinstall` script now runs `prisma generate` automatically.

### Build Fails with "Migration Out of Sync"

Your migrations don't match your schema. You need to create new migrations:

```bash
npx prisma migrate dev --name fix_schema
```

### "No migrations found" Error

You need to initialize migrations:

```bash
npx prisma migrate dev --name init
```

### Database Connection Error

Check your `DATABASE_URL` environment variable is correctly set on Vercel.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev` | Create and apply migration (development) |
| `npx prisma migrate deploy` | Apply existing migrations (production) |
| `npx prisma migrate reset` | Reset database and migrations (⚠️ destructive) |
| `npx prisma studio` | Open database GUI |
| `npx prisma db push` | Push schema changes without migrations |

## Next Steps

1. ✅ Add `DATABASE_URL` to Vercel environment variables
2. ⚠️ Create a proper migration for your current schema
3. ✅ Deploy to Vercel
4. ✅ Verify database connection works
5. ✅ Seed initial data if needed

## Questions or Issues?

If you encounter problems:
1. Check the Vercel build logs
2. Verify environment variables are set correctly
3. Ensure your database allows connections from Vercel IPs
4. Check Prisma documentation: https://www.prisma.io/docs

