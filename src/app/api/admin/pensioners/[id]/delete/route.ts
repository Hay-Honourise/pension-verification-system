import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Resolve pensioner ID (supports both database ID and pensionId)
    const numericId = parseInt(idParam, 10);
    const isNumericId = !isNaN(numericId) && numericId.toString() === idParam;

    let pensionerId: number | null = null;
    let pensioner = null;

    // Try to find by database ID first
    if (isNumericId) {
      pensioner = await prisma.pensioner.findUnique({
        where: { id: numericId },
        include: {
          pensionerfile: true,
          verificationlog: true,
          verificationreview: true
        }
      });
      if (pensioner) {
        pensionerId = pensioner.id;
      }
    }

    // If not found by ID, try to find by pensionId
    if (!pensioner) {
      pensioner = await prisma.pensioner.findUnique({
        where: { pensionId: idParam },
        include: {
          pensionerfile: true,
          verificationlog: true,
          verificationreview: true
        }
      });
      if (pensioner) {
        pensionerId = pensioner.id;
      }
    }

    if (!pensioner || !pensionerId) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.verificationlog.deleteMany({
      where: { pensionerId: pensionerId }
    });

    await prisma.verificationreview.deleteMany({
      where: { pensionerId: pensionerId }
    });

    await prisma.pensionerfile.deleteMany({
      where: { pensionerId: pensionerId }
    });

    // Finally delete the pensioner
    await prisma.pensioner.delete({
      where: { id: pensionerId }
    });

    console.log(`🗑️ Pensioner ${pensionerId} deleted by admin ${token.id}`);

    return NextResponse.json({
      success: true,
      message: 'Pensioner deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting pensioner:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
