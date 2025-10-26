import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    const pensionerId = params.id;

    if (!pensionerId) {
      return NextResponse.json({ message: 'Pensioner ID is required' }, { status: 400 });
    }

    // Check if pensioner exists
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: parseInt(pensionerId) },
      include: {
        pensionerfile: true,
        verificationlog: true,
        verificationreview: true
      }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Delete related records first (due to foreign key constraints)
    await prisma.verificationlog.deleteMany({
      where: { pensionerId: parseInt(pensionerId) }
    });

    await prisma.verificationreview.deleteMany({
      where: { pensionerId: parseInt(pensionerId) }
    });

    await prisma.pensionerfile.deleteMany({
      where: { pensionerId: parseInt(pensionerId) }
    });

    // Finally delete the pensioner
    await prisma.pensioner.delete({
      where: { id: parseInt(pensionerId) }
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
