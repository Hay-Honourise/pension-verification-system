import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') || 20)));

    // Get verification logs
    const [logs, total] = await Promise.all([
      prisma.verificationlog.findMany({
        where: {
          pensionerId: Number(token.id)
        },
        orderBy: {
          verifiedAt: 'desc'
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          method: true,
          status: true,
          verifiedAt: true,
          nextDueAt: true
        }
      }),
      prisma.verificationlog.count({
        where: {
          pensionerId: Number(token.id)
        }
      })
    ]);

    return NextResponse.json({ 
      logs: logs.map(log => ({
        id: log.id,
        method: log.method,
        status: log.status,
        verifiedAt: log.verifiedAt?.toISOString() || null,
        nextDueAt: log.nextDueAt?.toISOString() || null,
        officerName: null // This would need to be joined from user table if needed
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });

  } catch (err) {
    console.error('[verification/logs] error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
