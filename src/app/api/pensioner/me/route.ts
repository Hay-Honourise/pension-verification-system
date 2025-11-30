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

    // Require pensioner role for this endpoint; allow UUIDs for other roles to authenticate elsewhere
    if (token.role !== 'pensioner') {
      console.warn('⚠️ Non-pensioner token accessing /pensioner/me. Role:', token.role, 'ID type:', typeof token.id);
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // For pensioners, ID must be numeric because DB primary key is numeric
    const pensionerId = Number(token.id);
    if (Number.isNaN(pensionerId)) {
      console.warn('⚠️ Pensioner token has non-numeric ID. ID:', token.id);
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
        status: true,
        nextDueAt: true,
        verificationlog: {
          orderBy: { verifiedAt: 'desc' },
          take: 10,
          select: { id: true, method: true, status: true, verifiedAt: true, nextDueAt: true },
        },
        verificationreview: {
          orderBy: { reviewedAt: 'desc' },
          take: 1,
          select: { id: true, status: true, reviewedAt: true },
        },
        biometriccredential: {
          select: { id: true, type: true, createdAt: true },
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

    // Determine document verification status
    // Document verification is considered complete if:
    // 1. Pensioner status is VERIFIED, or
    // 2. There's a verification review with status VERIFIED, or
    // 3. There's a verification log with ADMIN_REVIEW or MANUAL_REVIEW method and VERIFIED status
    const hasVerifiedReview = pensioner.verificationreview && pensioner.verificationreview.length > 0 && 
                               pensioner.verificationreview[0].status === 'VERIFIED';
    const hasAdminVerification = pensioner.verificationlog?.some(
      log => log.status === 'VERIFIED' && 
      (log.method === 'ADMIN_REVIEW' || log.method === 'MANUAL_REVIEW')
    );
    const hasRejectedReview = pensioner.verificationreview && pensioner.verificationreview.length > 0 && 
                              pensioner.verificationreview[0].status === 'REJECTED';
    const hasAdminRejection = pensioner.verificationlog?.some(
      log => log.status === 'REJECTED' && 
      (log.method === 'ADMIN_REVIEW' || log.method === 'MANUAL_REVIEW')
    );

    const documentVerificationStatus = 
      pensioner.status === 'VERIFIED' || hasVerifiedReview || hasAdminVerification
        ? 'VERIFIED'
        : pensioner.status === 'REJECTED' || hasRejectedReview || hasAdminRejection
        ? 'REJECTED'
        : 'PENDING';

    // Log document verification status for debugging
    console.log('📄 Document Verification Status:', {
      pensionerStatus: pensioner.status,
      hasVerifiedReview,
      hasAdminVerification,
      hasRejectedReview,
      hasAdminRejection,
      finalStatus: documentVerificationStatus,
      verificationLogs: pensioner.verificationlog?.map(log => ({ method: log.method, status: log.status })),
      verificationReviews: pensioner.verificationreview?.map(review => ({ status: review.status })),
    });

    // Determine biometric verification status
    // Biometric verification is complete if there's at least one successful verification log
    const successfulBiometricVerification = pensioner.verificationlog?.find(
      log => log.status === 'VERIFIED' && 
      (log.method?.includes('Biometric') || log.method?.includes('Face') || log.method?.includes('Fingerprint'))
    );
    const biometricVerificationStatus = successfulBiometricVerification ? 'VERIFIED' : 'PENDING';
    const biometricVerificationDueDate = successfulBiometricVerification?.nextDueAt || pensioner.nextDueAt;

    console.log('✅ [pensioner/me] Request completed successfully');
    return NextResponse.json({ 
      pensioner, 
      documents,
      documentVerificationStatus,
      biometricVerificationStatus,
      biometricVerificationDueDate,
    });
    
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


