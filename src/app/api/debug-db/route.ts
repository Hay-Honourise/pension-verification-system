import { NextRequest, NextResponse } from 'next/server';
import { prisma, getDatabaseDiagnostics } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const diagnostics = getDatabaseDiagnostics();
    
    // Test database connection
    let connectionTest = {
      status: 'testing...',
      error: null as string | null,
      code: null as string | null,
    };

    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      connectionTest.status = 'connected';
      connectionTest.error = null;
    } catch (error: any) {
      connectionTest.status = 'failed';
      connectionTest.error = error.message || 'Unknown error';
      connectionTest.code = error.code || null;
      
      // Detect invalid host in error message
      if (error.code === 'P1001') {
        const errorMessage = error.message || '';
        const invalidHostMatch = errorMessage.match(/`([^`]+):(\d+)`/);
        const invalidHost = invalidHostMatch ? invalidHostMatch[1] : null;
        
        if (invalidHost === 'db.prisma.io') {
          diagnostics.recommendations = [
            '⚠️ CRITICAL: Invalid database host "db.prisma.io" detected',
            'This is NOT a valid database server. Your DATABASE_URL is incorrectly configured.',
            'Update your DATABASE_URL in .env.local with a valid PostgreSQL connection string.',
            'Format: postgresql://user:password@host:port/database',
            'Examples:',
            '  - Local: postgresql://postgres:password@localhost:5432/pension_db',
            '  - Supabase: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres',
            '  - Neon: postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech:5432/neondb'
          ];
        }
      }
    } finally {
      await prisma.$disconnect();
    }

    // Generate instructions based on error type
    let instructions = null;
    if (connectionTest.status === 'failed') {
      if (connectionTest.code === 'P1001') {
        // P1001 = Invalid database host
        instructions = {
          immediateFix: 'Fix invalid database host in DATABASE_URL',
          steps: [
            '1. Open your .env.local file',
            '2. Check your DATABASE_URL - it should point to a valid PostgreSQL server',
            '3. Format: postgresql://user:password@host:port/database',
            '4. Examples:',
            '   - Local: postgresql://postgres:password@localhost:5432/pension_db',
            '   - Supabase: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres',
            '   - Neon: postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech:5432/neondb',
            '5. Make sure the host is NOT "db.prisma.io" (this is invalid)',
            '6. Restart your development server (npm run dev)',
            '7. Test at /api/debug-db - should show "connected"'
          ],
          whereToFindConnectionString: {
            supabase: 'Supabase: Project Settings → Database → Connection String (URI mode)',
            neon: 'Neon: Dashboard → Connection String',
            railway: 'Railway: Service → Variables → DATABASE_URL',
            render: 'Render: Database → Internal Database URL',
            awsRds: 'AWS RDS: RDS Console → Endpoint',
            heroku: 'Heroku Postgres: Settings → Database Credentials',
            local: 'For local PostgreSQL, use: postgresql://postgres:yourpassword@localhost:5432/yourdatabase'
          }
        };
      } else if (diagnostics.accelerateConfigured) {
        // Prisma Accelerate connection failure
        instructions = {
          immediateFix: 'Switch to direct database connection',
          whereToFindDirectUrl: {
            prismaCloud: 'Go to https://cloud.prisma.io → Your Project → Settings → Connection Strings → Direct Connection URL',
            databaseProviders: {
              supabase: 'Supabase: Project Settings → Database → Connection String (URI mode)',
              neon: 'Neon: Dashboard → Connection String',
              railway: 'Railway: Service → Variables → DATABASE_URL',
              render: 'Render: Database → Internal Database URL',
              awsRds: 'AWS RDS: RDS Console → Endpoint',
              heroku: 'Heroku Postgres: Settings → Database Credentials'
            }
          },
          steps: [
            '1. Get your direct PostgreSQL connection string (see "whereToFindDirectUrl" above)',
            '2. Open your .env.local file',
            '3. Replace DATABASE_URL with: postgresql://user:password@host:port/database?sslmode=require',
            '4. Remove the "prisma+postgres://accelerate.prisma-data.net" part completely',
            '5. Restart your development server (npm run dev)',
            '6. Test at /api/debug-db - should show "connected"'
          ],
          example: {
            old: 'DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=..."',
            new: 'DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"'
          },
          alternative: 'If you want to keep using Accelerate, check:',
          accelerateChecks: [
            'Verify Accelerate API key is valid in Prisma Cloud: https://cloud.prisma.io',
            'Check network connectivity: ping accelerate.prisma-data.net',
            'Check firewall/proxy settings',
            'Verify Accelerate service status: https://status.prisma.io',
            'Note: Accelerate may be blocked by your network/firewall'
          ]
        };
      }
    }

    return NextResponse.json({
      ...diagnostics,
      connectionTest,
      instructions
    }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Diagnostic failed',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

