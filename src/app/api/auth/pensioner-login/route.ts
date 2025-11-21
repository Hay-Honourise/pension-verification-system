import { NextRequest, NextResponse } from 'next/server';
import { prisma, retryQuery } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { pensionId, password } = await request.json();

    if (!pensionId || !password) {
      return NextResponse.json(
        { message: 'Pension ID and password are required' },
        { status: 400 }
      );
    }

    // Find pensioner by pensionId with retry logic for connection issues
    let pensioner;
    try {
      pensioner = await retryQuery(
        () => prisma.pensioner.findUnique({
          where: { pensionId }
        })
      );
    } catch (dbError: any) {
      console.error('Pensioner login DB error:', dbError);
      
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

    if (!pensioner) {
      return NextResponse.json(
        { message: 'Invalid Pension ID or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, pensioner.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid Pension ID or password' },
        { status: 401 }
      );
    }

    // Update last login timestamp with retry logic
    try {
      await retryQuery(
        () => prisma.pensioner.update({
          where: { id: pensioner.id },
          data: { lastLogin: new Date() }
        })
      );
    } catch (updateError) {
      // Log but don't fail login if lastLogin update fails
      console.warn('Failed to update lastLogin timestamp:', updateError);
    }

    // Generate JWT token
    const token = generateToken({
      id: pensioner.id,
      role: 'pensioner',
      email: pensioner.email,
      pensionId: pensioner.pensionId,
    });

    // Return success response with token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: pensioner.id,
        pensionId: pensioner.pensionId,
        fullName: pensioner.fullName,
        photo: pensioner.photo,
        email: pensioner.email,
        status: pensioner.status,
        role: 'pensioner',
        // Include calculated benefits
        yearsOfService: pensioner.yearsOfService,
        totalGratuity: pensioner.totalGratuity,
        monthlyPension: pensioner.monthlyPension,
        gratuityRate: pensioner.gratuityRate,
        pensionRate: pensioner.pensionRate,
        salary: pensioner.salary,
        pensionSchemeType: pensioner.pensionSchemeType,
        currentLevel: pensioner.currentLevel,
        dateOfFirstAppointment: pensioner.dateOfFirstAppointment
      }
    });

  } catch (error: any) {
    console.error('Pensioner login error:', error);
    
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
