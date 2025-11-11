# 🔧 Database Connection Fix Guide

## Problem
Prisma Accelerate is failing to connect with error `P5010: Cannot fetch data from service: fetch failed`

## Solution: Switch to Direct Database Connection

### Step 1: Get Your Direct PostgreSQL Connection String

You need to find your **direct PostgreSQL connection string** (not the Accelerate URL). Here's where to find it:

#### Option A: From Prisma Cloud Dashboard
1. Go to [Prisma Cloud](https://cloud.prisma.io)
2. Navigate to your project
3. Go to **Settings** → **Connection Strings**
4. Look for **Direct Connection URL** or **Connection Pooling URL**
5. Copy the PostgreSQL connection string (format: `postgresql://user:password@host:port/database`)

#### Option B: From Your Database Provider
If you're using a database provider, get the connection string from their dashboard:

- **Supabase**: Project Settings → Database → Connection String (URI mode)
- **Neon**: Dashboard → Connection String
- **Railway**: Service → Variables → `DATABASE_URL`
- **Render**: Database → Internal Database URL
- **AWS RDS**: RDS Console → Endpoint
- **Heroku Postgres**: Settings → Database Credentials

#### Option C: If You Have DIRECT_URL Already
If you previously had `DIRECT_URL` in your environment, you can use that value.

### Step 2: Update Your .env.local File

1. Open `.env.local` in your project root
2. Replace the `DATABASE_URL` line with your direct PostgreSQL connection string:

```env
# OLD (Accelerate - not working):
# DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."

# NEW (Direct connection):
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**Important**: 
- Remove the `prisma+postgres://accelerate.prisma-data.net` part
- Use the format: `postgresql://user:password@host:port/database`
- Add `?sslmode=require` if your database requires SSL

### Step 3: Optional - Add DIRECT_URL for Future Use

If you want to keep both Accelerate and Direct URLs (for future use), add:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DIRECT_URL="postgresql://user:password@host:port/database?sslmode=require"
```

### Step 4: Restart Your Development Server

1. Stop your current dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 5: Verify the Fix

1. Visit: `http://localhost:3000/api/debug-db`
2. You should see:
   - `"connectionType": "Direct"`
   - `"connectionTest": { "status": "connected" }`

## Alternative: Fix Prisma Accelerate (If You Want to Keep Using It)

If you prefer to keep using Prisma Accelerate, check:

1. **Verify Accelerate API Key**:
   - Go to [Prisma Cloud](https://cloud.prisma.io)
   - Check if your Accelerate API key is still valid
   - Regenerate if needed

2. **Check Network Connectivity**:
   ```bash
   ping accelerate.prisma-data.net
   ```
   If this fails, you may have firewall/proxy issues.

3. **Check Service Status**:
   - Visit: https://status.prisma.io
   - Check if Accelerate service is operational

4. **Firewall/Proxy Settings**:
   - Ensure your network allows connections to `accelerate.prisma-data.net`
   - Check if you're behind a corporate firewall that blocks Prisma Accelerate

## Quick Test

After updating your `.env.local`, test the connection:

```bash
npx prisma db pull
```

If this succeeds, your connection is working!

## Still Having Issues?

1. Check your `.env.local` file format is correct
2. Verify your database credentials are correct
3. Ensure your database server is accessible from your network
4. Check if your database requires SSL (add `?sslmode=require`)
5. Visit `/api/debug-db` for detailed diagnostics

