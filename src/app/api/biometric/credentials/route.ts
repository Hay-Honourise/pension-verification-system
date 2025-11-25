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

    // Get pensioner's registered credentials
    const credentials = await prisma.biometriccredential.findMany({
      where: {
        pensionerId: Number(token.id)
      },
      select: {
        id: true,
        type: true,
        credentialId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // In dev mode, include credentialId for debugging
    const isDev = process.env.NODE_ENV === 'development';

    return NextResponse.json({ 
      credentials: credentials.map(cred => ({
        id: cred.id,
        type: cred.type,
        credentialId: isDev ? cred.credentialId : undefined, // Only expose in dev mode
        credentialIdPreview: cred.credentialId.substring(0, 20) + '...', // Always show preview
        registeredAt: cred.createdAt.toISOString()
      }))
    });

  } catch (err) {
    console.error('[biometric/credentials] error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
