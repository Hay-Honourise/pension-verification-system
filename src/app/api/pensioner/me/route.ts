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
      where: { id: token.id },
      select: {
        id: true,
        pensionId: true,
        fullName: true,
        email: true,
        phone: true,
        residentialAddress: true,
        bankDetails: true,
        // document fields are optional in some schemas
        // @ts-ignore
        idCard: true,
        // @ts-ignore
        birthCert: true,
        // @ts-ignore
        appointment: true,
        // @ts-ignore
        retirement: true,
      },
    });

    if (!pensioner) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const documents: any = {};
    // Prefer direct fields if present
    // @ts-ignore
    if (pensioner.idCard) documents.idCard = pensioner.idCard;
    // @ts-ignore
    if (pensioner.birthCert) documents.birthCert = pensioner.birthCert;
    // @ts-ignore
    if (pensioner.appointment) documents.appointment = pensioner.appointment;
    // @ts-ignore
    if (pensioner.retirement) documents.retirement = pensioner.retirement;

    // If no direct fields, attempt to read latest Document rows
    if (Object.keys(documents).length === 0) {
      const rows = await prisma.document.findMany({ where: { pensionerId: pensioner.id }, orderBy: { uploadedAt: 'desc' } });
      for (const row of rows) {
        // keep the latest per type
        if (!documents[row.documentType]) documents[row.documentType] = row.filePath;
      }
    }

    return NextResponse.json({ pensioner, documents });
  } catch (err) {
    console.error('[pensioner/me] error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}


