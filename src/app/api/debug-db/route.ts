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
    } finally {
      await prisma.$disconnect();
    }

    return NextResponse.json({
      ...diagnostics,
      connectionTest,
      instructions: diagnostics.accelerateConfigured && connectionTest.status === 'failed'
        ? {
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
            ],
            helpDocument: 'See DATABASE_CONNECTION_FIX.md for detailed instructions'
          }
        : null
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

