import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const { action, reason } = await request.json();

    if (!pensionerId) {
      return NextResponse.json({ message: 'Pensioner ID is required' }, { status: 400 });
    }

    if (!action) {
      return NextResponse.json({ message: 'Action is required' }, { status: 400 });
    }

    let updateData: any = {};
    let logMessage = '';

    switch (action) {
      case 'approve':
        updateData = { status: 'VERIFIED' };
        logMessage = 'Pensioner approved by admin';
        break;
      
      case 'flag':
        updateData = { status: 'FLAGGED' };
        logMessage = `Pensioner flagged: ${reason || 'Suspicious activity detected'}`;
        break;
      
      case 'reject':
        updateData = { status: 'REJECTED' };
        logMessage = `Pensioner rejected: ${reason || 'Failed verification'}`;
        break;
      
      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 });
    }

    // Update pensioner status
    const updatedPensioner = await prisma.pensioner.update({
      where: { id: parseInt(pensionerId) },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    // Create verification log entry
    await prisma.verificationlog.create({
      data: {
        pensionerId: parseInt(pensionerId),
        method: 'ADMIN_REVIEW',
        status: action.toUpperCase(),
        verifiedAt: new Date(),
        nextDueAt: action === 'approve' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null // 1 year for approved
      }
    });

    console.log(`✅ Pensioner ${pensionerId} ${action}d by admin ${token.id}`);

    return NextResponse.json({
      success: true,
      message: `Pensioner ${action}d successfully`,
      pensioner: updatedPensioner
    });

  } catch (error) {
    console.error('Error updating pensioner status:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
