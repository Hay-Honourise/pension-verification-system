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

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) },
      select: {
        id: true,
        pensionId: true,
        fullName: true,
        photo: true,
        email: true,
        phone: true,
        residentialAddress: true,
        verificationLogs: {
          orderBy: { verifiedAt: 'desc' },
          take: 3,
          select: { id: true, method: true, status: true, verifiedAt: true, nextDueAt: true },
        },
        pensionerfile: {
          select: {
            id: true,
            fileType: true,
            fileUrl: true,
            originalName: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!pensioner) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    // Organize files by type
    const documents: any = {};
    if (pensioner.pensionerfile) {
      for (const file of pensioner.pensionerfile) {
        documents[file.fileType] = {
          id: file.id,
          url: file.fileUrl,
          name: file.originalName,
          uploadedAt: file.createdAt,
        };
      }
    }

    return NextResponse.json({ pensioner, documents });
  } catch (err) {
    console.error('[pensioner/me] error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


