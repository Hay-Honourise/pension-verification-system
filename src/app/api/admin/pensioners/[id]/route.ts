import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

/**
 * Helper function to find a pensioner by database ID or pensionId
 * Returns the pensioner's database ID if found, null otherwise
 */
async function resolvePensionerId(idParam: string): Promise<number | null> {
  // Try to parse as integer (database ID) first
  const numericId = parseInt(idParam, 10);
  const isNumericId = !isNaN(numericId) && numericId.toString() === idParam;

  // First, try to find by database ID if it's numeric
  if (isNumericId) {
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: numericId },
      select: { id: true }
    });
    if (pensioner) {
      return pensioner.id;
    }
  }

  // If not found by ID, try to find by pensionId
  const pensioner = await prisma.pensioner.findUnique({
    where: { pensionId: idParam },
    select: { id: true }
  });

  return pensioner ? pensioner.id : null;
}

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
    const idParam = resolvedParams.id;

    if (!idParam) {
      return NextResponse.json({ message: 'Pensioner ID is required' }, { status: 400 });
    }

    console.log('🔍 Fetching pensioner with ID parameter:', idParam);

    // Resolve pensioner ID (supports both database ID and pensionId)
    const resolvedId = await resolvePensionerId(idParam);

    if (!resolvedId) {
      console.log('❌ Pensioner not found with:', idParam);
      return NextResponse.json({ 
        message: 'Pensioner not found',
        debug: process.env.NODE_ENV === 'development' ? { idParam } : undefined
      }, { status: 404 });
    }

    console.log('✅ Resolved pensioner ID:', resolvedId);

    // Get pensioner details with all related data
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: resolvedId },
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
      console.log('❌ Pensioner not found after resolution:', resolvedId);
      return NextResponse.json({ 
        message: 'Pensioner not found'
      }, { status: 404 });
    }

    console.log('✅ Pensioner found:', { id: pensioner.id, pensionId: pensioner.pensionId, name: pensioner.fullName });

    return NextResponse.json({ pensioner });

  } catch (error) {
    console.error('Error fetching pensioner details:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
