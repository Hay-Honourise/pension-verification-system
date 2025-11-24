# 🔧 Fix: Database Connection Error (10054)

## Error Message
```
Error { kind: Io, cause: Some(Os { code: 10054, kind: ConnectionReset, 
message: "An existing connection was forcibly closed by the remote host." }) }
```

## What This Means
Error code **10054** means the database server forcibly closed the connection. This typically happens when:

1. **Invalid DATABASE_URL** - The host doesn't exist or is unreachable
2. **Database server is down** - The PostgreSQL server is not running
3. **Network issues** - Firewall, proxy, or network blocking the connection
4. **Connection timeout** - The server closed the connection due to inactivity
5. **Wrong credentials** - Authentication failed

## Quick Fix Steps

### Step 1: Check Your DATABASE_URL

Open your `.env.local` file and verify your `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
```

**Important:** Make sure:
- ✅ The host is a valid PostgreSQL server (NOT `db.prisma.io` - this is invalid)
- ✅ The port is correct (usually `5432`)
- ✅ Username and password are correct
- ✅ Database name exists

### Step 2: Verify Database Connection

Test your connection using the debug endpoint:

1. Start your dev server: `npm run dev`
2. Visit: `http://localhost:3000/api/debug-db`
3. Check the response - it will tell you exactly what's wrong

### Step 3: Common Issues & Solutions

#### Issue: Invalid Host
**Symptoms:** Error mentions `db.prisma.io` or unknown host

**Fix:**
```env
# ❌ WRONG:
DATABASE_URL="postgresql://user:pass@db.prisma.io:5432/db"

# ✅ CORRECT:
DATABASE_URL="postgresql://user:pass@your-actual-db-host:5432/db"
```

#### Issue: Database Server Not Running
**Symptoms:** Connection timeout or "Can't reach database server"

**Fix:**
- Check if PostgreSQL is running locally
- Verify your database provider's status page
- Check network connectivity

#### Issue: Wrong Credentials
**Symptoms:** Authentication failed

**Fix:**
- Double-check username and password
- Verify database name exists
- Check if user has proper permissions

#### Issue: SSL Required
**Symptoms:** SSL connection errors

**Fix:**
Add `?sslmode=require` to your connection string:
```env
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### Step 4: Get Connection String from Your Provider

#### Supabase
1. Go to Project Settings → Database
2. Copy "Connection string" (URI mode)
3. Format: `postgresql://postgres.xxx:[PASSWORD]@aws-0-xx-x.pooler.supabase.com:6543/postgres`

#### Neon
1. Go to Dashboard → Connection Details
2. Copy connection string
3. Format: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech:5432/neondb?sslmode=require`

#### Railway
1. Go to Service → Variables
2. Copy `DATABASE_URL`
3. Use as-is

#### Local PostgreSQL
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/pension_db"
```

### Step 5: Restart Your Server

After fixing `DATABASE_URL`:
```bash
# Stop your server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Test Again

1. Visit: `http://localhost:3000/api/debug-db`
2. Should show: `"connectionTest": { "status": "connected" }`

## Still Having Issues?

1. **Check server logs** - Look for more detailed error messages
2. **Test connection manually** - Use `psql` or database client:
   ```bash
   psql "postgresql://user:pass@host:port/database"
   ```
3. **Verify firewall** - Make sure port 5432 is not blocked
4. **Check database provider status** - Visit your provider's status page

## Need More Help?

- Check `/api/debug-db` endpoint for detailed diagnostics
- Review Prisma connection docs: https://www.prisma.io/docs/concepts/database-connectors/postgresql
- Check your database provider's connection troubleshooting guide

