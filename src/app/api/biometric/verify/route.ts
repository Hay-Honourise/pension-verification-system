import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type')?.toUpperCase();
    
    if (!type || !['FACE', 'FINGERPRINT'].includes(type)) {
      return NextResponse.json({ message: 'Invalid biometric type' }, { status: 400 });
    }

    // Get pensioner's registered credentials
    const credentials = await prisma.biometriccredential.findMany({
      where: {
        pensionerId: Number(token.id),
        type: type as 'FACE' | 'FINGERPRINT'
      }
    });

    if (credentials.length === 0) {
      return NextResponse.json({ message: 'No credentials registered' }, { status: 404 });
    }

    // Generate challenge
    const challenge = randomBytes(32);

    // Prepare allowCredentials
    const allowCredentials = credentials.map(cred => ({
      id: cred.credentialId,
      type: 'public-key',
      transports: ['internal']
    }));

    return NextResponse.json({
      challenge: Array.from(challenge),
      allowCredentials
    });

  } catch (err) {
    console.error('[biometric/verify] GET error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const token = verifyToken(bearer);
    if (!token?.id) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { type, credential } = body;

    if (!type || !credential) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    if (!['FACE', 'FINGERPRINT'].includes(type)) {
      return NextResponse.json({ message: 'Invalid biometric type' }, { status: 400 });
    }

    // Get pensioner
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Find the credential
    const storedCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: type as 'FACE' | 'FINGERPRINT',
        credentialId: credential.id
      }
    });

    if (!storedCredential) {
      return NextResponse.json({ message: 'Credential not found' }, { status: 404 });
    }

    // For now, we'll assume verification is successful
    // In a real implementation, you would verify the signature here
    const isVerified = true; // This should be replaced with actual signature verification

    if (isVerified) {
      // Create verification log
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + 3);

      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: `WINDOWS_HELLO_${type}`,
          status: 'SUCCESS',
          verifiedAt: new Date(),
          nextDueAt: nextDue
        }
      });

      return NextResponse.json({ 
        success: true, 
        status: 'SUCCESS',
        nextDueAt: nextDue,
        message: 'Verification successful'
      });
    } else {
      // Create review entry for failed verification
      await prisma.verificationreview.create({
        data: {
          pensionerId: pensioner.id,
          capturedPhoto: null, // No photo for biometric verification
          status: 'PENDING'
        }
      });

      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: `WINDOWS_HELLO_${type}`,
          status: 'PENDING_REVIEW'
        }
      });

      return NextResponse.json({ 
        success: false, 
        status: 'PENDING_REVIEW',
        message: 'Verification failed. Sent for officer review.'
      });
    }

  } catch (err) {
    console.error('[biometric/verify] POST error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
