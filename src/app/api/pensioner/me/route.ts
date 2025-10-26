import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [pensioner/me] Starting request...');
    
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!bearer) {
      console.log('❌ No bearer token found');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔑 Bearer token length:', bearer.length);

    const token = verifyToken(bearer);
    if (!token?.id) {
      console.log('❌ Invalid token or missing ID');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('👤 Token ID:', token.id, 'Role:', token.role);
    console.log('🔍 Token structure:', {
      id: token.id,
      role: token.role,
      email: token.email,
      pensionId: token.pensionId,
      type: typeof token.id
    });

    // Validate token ID
    if (!token.id) {
      console.log('❌ Token missing ID field');
      return NextResponse.json({ message: 'Invalid token: missing ID' }, { status: 401 });
    }

    const pensionerId = Number(token.id);
    if (Number.isNaN(pensionerId)) {
      console.log('❌ Token ID is not a valid number:', token.id);
      return NextResponse.json({ message: 'Invalid token: ID is not a number' }, { status: 401 });
    }

    console.log('🔍 Querying pensioner with ID:', pensionerId);

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: pensionerId },
      select: {
        id: true,
        pensionId: true,
        fullName: true,
        photo: true,
        email: true,
        phone: true,
        residentialAddress: true,
        verificationlog: {
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

    if (!pensioner) {
      console.log('❌ Pensioner not found for ID:', token.id);
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }

    console.log('✅ Pensioner found:', pensioner.fullName);

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

    console.log('✅ [pensioner/me] Request completed successfully');
    return NextResponse.json({ pensioner, documents });
    
  } catch (err) {
    console.error('❌ [pensioner/me] error:', err);
    console.error('❌ Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      name: err instanceof Error ? err.name : undefined
    });
    return NextResponse.json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? (err instanceof Error ? err.message : 'Unknown error') : undefined
    }, { status: 500 });
  }
}


