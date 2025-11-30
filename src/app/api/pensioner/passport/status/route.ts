import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'pensioner') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pensionerId = Number(token.id);
    if (Number.isNaN(pensionerId)) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get pensioner (fetch all fields since Prisma client hasn't been regenerated)
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: pensionerId },
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Type assertion for passport fields (Prisma client needs regeneration)
    // These fields exist in the database but TypeScript doesn't know about them yet
    const passportUploaded = (pensioner as any).passportUploaded as boolean | null | undefined;
    const passportUrl = (pensioner as any).passportUrl as string | null | undefined;
    const nextDueAt = pensioner.nextDueAt;

    return NextResponse.json({
      passportUploaded: passportUploaded ?? false,
      passportUrl: passportUrl ?? null,
      nextDueAt: nextDueAt,
    });
  } catch (error: any) {
    console.error('Passport status error:', error);
    return NextResponse.json(
      {
        message: 'Failed to get passport status',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

