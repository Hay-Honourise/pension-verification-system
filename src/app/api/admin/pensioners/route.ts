import { NextRequest, NextResponse } from 'next/server';
import { prisma, retryQuery } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 20)));
    const searchTerm = searchParams.get('search') || '';
    const statusFilter = searchParams.get('status') || 'all';
    const pensionTypeFilter = searchParams.get('pensionType') || 'all';

    // Build where clause
    const where: any = {};
    
    // Search by name or pension ID
    if (searchTerm) {
      where.OR = [
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
        { pensionId: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      where.status = statusFilter.toUpperCase();
    }
    
    // Pension type filter
    if (pensionTypeFilter !== 'all') {
      where.pensionSchemeType = pensionTypeFilter.toUpperCase();
    }

    // Fetch pensioners and total count with retry logic for connection issues
    let pensioners, total;
    try {
      [pensioners, total] = await Promise.all([
        retryQuery(() => prisma.pensioner.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
          select: {
            id: true,
            pensionId: true,
            fullName: true,
            status: true,
            pensionSchemeType: true,
            createdAt: true,
            lastLogin: true,
            pensionerfile: {
              select: {
                fileType: true,
                originalName: true
              }
            }
          }
        })),
        retryQuery(() => prisma.pensioner.count({ where }))
      ]);
    } catch (dbError: any) {
      console.error('[admin/pensioners] Database error:', dbError);
      
      // Check for P1001 error (invalid database host)
      if (dbError?.code === 'P1001') {
        const errorMessage = dbError.message || '';
        const invalidHostMatch = errorMessage.match(/`([^`]+):(\d+)`/);
        const invalidHost = invalidHostMatch ? invalidHostMatch[1] : 'unknown';
        
        return NextResponse.json({
          error: 'Database configuration error',
          message: `Invalid database host: ${invalidHost}. Please check your DATABASE_URL in .env.local`,
          code: dbError.code,
          details: process.env.NODE_ENV === 'development' ? {
            invalidHost,
            errorMessage: dbError.message,
            recommendation: invalidHost === 'db.prisma.io'
              ? 'The host "db.prisma.io" is not a valid database server. Please update your DATABASE_URL in .env.local with a valid PostgreSQL connection string.'
              : `The host "${invalidHost}" is not accessible. Please verify your DATABASE_URL points to a valid database server.`
          } : undefined
        }, { status: 503 });
      }
      
      // Check for other connection errors
      const isConnectionError = 
        dbError?.code === 'P5010' || 
        dbError?.message?.includes('fetch failed') ||
        dbError?.message?.includes('Cannot fetch data from service') ||
        dbError?.message?.includes("Can't reach database server") ||
        dbError?.message?.includes('Response from the Engine was empty');
      
      if (isConnectionError) {
        return NextResponse.json({
          error: 'Database unavailable',
          message: 'Unable to connect to the database.',
          code: dbError.code,
          details: process.env.NODE_ENV === 'development' ? {
            errorMessage: dbError.message,
            recommendation: 'Check your DATABASE_URL configuration in .env.local and ensure the database server is accessible.'
          } : undefined
        }, { status: 503 });
      }
      
      // Re-throw other errors to be handled by outer catch
      throw dbError;
    }

    // Format pensioners data
    const formattedPensioners = pensioners.map(pensioner => {
      let lastLoginFormatted = 'Never';
      if (pensioner.lastLogin) {
        try {
          const date = new Date(pensioner.lastLogin);
          // Format date safely for server-side rendering
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const month = months[date.getMonth()];
          const day = date.getDate();
          const year = date.getFullYear();
          let hours = date.getHours();
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          hours = hours % 12 || 12;
          lastLoginFormatted = `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
        } catch (error) {
          console.error('[admin/pensioners] Error formatting lastLogin:', error);
          lastLoginFormatted = 'Invalid date';
        }
      }
      
      return {
        id: pensioner.id, // Use database ID, not pensionId
        pensionId: pensioner.pensionId,
        fullName: pensioner.fullName,
        name: pensioner.fullName, // Keep both for compatibility
        category: pensioner.pensionSchemeType || 'Unknown',
        status: pensioner.status,
        documents: pensioner.pensionerfile.map(file => file.originalName),
        lastLogin: lastLoginFormatted,
        dateRegistered: new Date(pensioner.createdAt).toLocaleDateString()
      };
    });

    return NextResponse.json({
      pensioners: formattedPensioners,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (err: any) {
    console.error('[admin/pensioners] error', err);
    
    // Log the full error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin/pensioners] error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        code: err?.code,
        name: err instanceof Error ? err.name : undefined
      });
    }
    
    // Handle Prisma errors specifically
    if (err?.code?.startsWith('P')) {
      return NextResponse.json({ 
        error: 'Database error',
        message: err.message || 'A database error occurred',
        code: err.code,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      error: 'Server error',
      message: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
