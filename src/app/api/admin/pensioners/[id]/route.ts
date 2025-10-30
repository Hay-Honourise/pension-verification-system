import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const resolvedParams = await params;
    const pensionerId = resolvedParams.id;

    if (!pensionerId) {
      return NextResponse.json({ message: 'Pensioner ID is required' }, { status: 400 });
    }

    // Get pensioner details with all related data
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: parseInt(pensionerId) },
      include: {
        pensionerfile: {
          orderBy: { createdAt: 'desc' }
        },
        verificationlog: {
          orderBy: { verifiedAt: 'desc' },
          take: 5
        },
        verificationreview: {
          orderBy: { reviewedAt: 'desc' },
          take: 3
        }
      }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    return NextResponse.json({ pensioner });

  } catch (error) {
    console.error('Error fetching pensioner details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
