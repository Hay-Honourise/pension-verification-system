import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// System settings stored in environment variables (read-only display)
// For actual configuration changes, these would need to be stored in a database table
// For now, we'll return the current environment configuration

export async function GET(request: NextRequest) {
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

    // Get system statistics for display
    const [
      totalPensioners,
      verifiedPensioners,
      pendingReviews,
      totalAdmins,
      totalOfficers,
      totalVerificationLogs,
    ] = await Promise.all([
      prisma.pensioner.count(),
      prisma.pensioner.count({ where: { status: 'VERIFIED' } }),
      prisma.verificationreview.count({ where: { status: 'PENDING' } }),
      prisma.admin.count(),
      prisma.user.count({ where: { role: 'VERIFICATION_OFFICER' } }),
      prisma.verificationlog.count(),
    ]);

    // Get latest verification log to determine verification interval
    const latestVerification = await prisma.verificationlog.findFirst({
      where: {
        status: 'VERIFIED',
        nextDueAt: { not: null },
      },
      orderBy: { verifiedAt: 'desc' },
      select: { verifiedAt: true, nextDueAt: true },
    });

    // Calculate verification interval (in months) from latest verification
    let verificationIntervalMonths = 3; // Default
    if (latestVerification?.verifiedAt && latestVerification?.nextDueAt) {
      const verifiedDate = new Date(latestVerification.verifiedAt);
      const dueDate = new Date(latestVerification.nextDueAt);
      const diffTime = dueDate.getTime() - verifiedDate.getTime();
      verificationIntervalMonths = Math.round(diffTime / (1000 * 60 * 60 * 24 * 30));
    }

    // Return system settings (read-only from env, calculated stats)
    const settings = {
      systemName: process.env.RP_NAME || 'Oyo Pension Verification System',
      systemVersion: '1.0.0',
      verificationIntervalMonths,
      verificationIntervalYears: Math.round(verificationIntervalMonths / 12 * 10) / 10,
      rpId: process.env.RP_ID || 'localhost',
      origin: process.env.ORIGIN || 'http://localhost:3000',
      awsRegion: process.env.AWS_REGION || 'us-east-1',
      s3Bucket: process.env.AWS_S3_BUCKET || 'Not configured',
      rekognitionCollection: process.env.AWS_REKOGNITION_COLLECTION || 'Not configured',
      redisConfigured: !!(process.env.REDIS_URL && process.env.REDIS_TOKEN),
      databaseProvider: 'PostgreSQL',
      biometricVerificationEnabled: true,
      faceVerificationEnabled: true,
      fingerprintVerificationEnabled: true,
      // Statistics
      statistics: {
        totalPensioners,
        verifiedPensioners,
        pendingReviews,
        totalAdmins,
        totalOfficers,
        totalVerificationLogs,
      },
      // Environment info (masked for security)
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        hasAwsConfig: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
        hasRedisConfig: !!(process.env.REDIS_URL && process.env.REDIS_TOKEN),
        hasDatabaseConfig: !!process.env.DATABASE_URL,
      },
    };

    return NextResponse.json({ settings });
  } catch (error: any) {
    console.error('Settings fetch error:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch system settings',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

