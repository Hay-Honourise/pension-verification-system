import { NextRequest, NextResponse } from 'next/server';
import { prisma, retryQuery } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find admin by email with retry logic for connection issues
    let admin;
    try {
      admin = await retryQuery(
        () => prisma.admin.findUnique({
          where: { email }
        })
      );
    } catch (dbError: any) {
      console.error('Login DB error:', dbError);
      
      // Check for P1001 error (invalid database host)
      if (dbError?.code === 'P1001') {
        const errorMessage = dbError.message || '';
        const invalidHostMatch = errorMessage.match(/`([^`]+):(\d+)`/);
        const invalidHost = invalidHostMatch ? invalidHostMatch[1] : 'unknown';
        
        console.error('❌ Invalid database host detected:', {
          invalidHost,
          databaseUrl: process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'), // Mask password
          errorCode: dbError.code
        });
        
        return NextResponse.json({
          error: 'Database configuration error',
          message: `Invalid database host: ${invalidHost}. Please check your DATABASE_URL in .env.local`,
          code: dbError.code,
          details: process.env.NODE_ENV === 'development' ? {
            invalidHost,
            errorMessage: dbError.message,
            recommendation: invalidHost === 'db.prisma.io'
              ? 'The host "db.prisma.io" is not a valid database server. Please update your DATABASE_URL in .env.local with a valid PostgreSQL connection string (e.g., postgresql://user:password@host:port/database).'
              : `The host "${invalidHost}" is not accessible. Please verify your DATABASE_URL points to a valid database server.`
          } : undefined
        }, { status: 503 });
      }
      
      const isConnectionError = 
        dbError?.code === 'P5010' || 
        dbError?.message?.includes('fetch failed') ||
        dbError?.message?.includes('Cannot fetch data from service') ||
        dbError?.message?.includes("Can't reach database server");
      
      if (isConnectionError) {
        const diagnostics = {
          error: 'Database unavailable',
          message: 'Unable to connect to the database.',
          details: process.env.NODE_ENV === 'development' ? {
            errorMessage: dbError.message,
            errorCode: dbError.code,
            recommendation: process.env.DATABASE_URL?.includes('accelerate')
              ? 'Consider switching to DIRECT_URL in .env.local if Accelerate continues to fail. ' +
                'Check network connectivity to accelerate.prisma-data.net and verify your Accelerate API key is valid.'
              : 'Check your DATABASE_URL configuration in .env.local and ensure the database server is accessible. ' +
                'The format should be: postgresql://user:password@host:port/database'
          } : undefined
        };
        
        console.error('❌ Database connection failed:', {
          code: dbError.code,
          message: dbError.message,
          isAccelerate: process.env.DATABASE_URL?.includes('accelerate'),
          hasDirectUrl: !!process.env.DIRECT_URL
        });
        
        return NextResponse.json(diagnostics, { status: 503 });
      }
      
      // Re-throw other errors to be handled by outer catch
      throw dbError;
    }

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, admin.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken(admin);

    // Return success response with token
    return NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    
    // Handle Prisma errors specifically
    if (error?.code?.startsWith('P')) {
      return NextResponse.json(
        { 
          error: 'Database error',
          message: error.message || 'A database error occurred',
          code: error.code,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
