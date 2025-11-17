import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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

    const [pensioners, total] = await Promise.all([
      prisma.pensioner.findMany({
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
      }),
      prisma.pensioner.count({ where })
    ]);

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

  } catch (err) {
    console.error('[admin/pensioners] error', err);
    // Log the full error details in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[admin/pensioners] error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
    }
    return NextResponse.json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined
    }, { status: 500 });
  }
}
