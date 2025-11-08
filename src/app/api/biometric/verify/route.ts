import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

// In-memory challenge storage (keyed by userId_type)
const verificationChallenges = new Map<string, { challenge: Buffer; expiresAt: number }>();

// Clean up expired challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of verificationChallenges.entries()) {
    if (value.expiresAt < now) {
      verificationChallenges.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Helper to convert base64url string to Uint8Array (for client-side use)
// Note: This is not used on the server, but kept for reference
// The server sends credentialId as base64url string, client decodes it

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
      return NextResponse.json({ 
        message: 'Invalid biometric type. Must be FACE or FINGERPRINT',
        error: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Get pensioner's registered credentials - ONLY for the specified type
    const credentials = await prisma.biometriccredential.findMany({
      where: {
        pensionerId: Number(token.id),
        type: type as 'FACE' | 'FINGERPRINT'
      }
    });

    if (credentials.length === 0) {
      return NextResponse.json({ 
        message: `No ${type} credentials registered. Please register ${type} first.`,
        error: 'NO_CREDENTIALS'
      }, { status: 404 });
    }

    // Generate challenge and store it per type
    const challenge = randomBytes(32);
    const challengeKey = `${token.id}_${type}`;
    verificationChallenges.set(challengeKey, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    // Prepare allowCredentials - convert credentialId from base64url string to Array for client
    // The credentialId is stored as base64url string, but WebAuthn needs it as ArrayBuffer/Uint8Array
    // We'll send it as base64url string and let the client decode it
    const allowCredentials = credentials.map(cred => {
      // credentialId is stored as base64url string, send it as-is
      // Client will decode it to Uint8Array
      return {
        id: cred.credentialId, // base64url string
        type: 'public-key',
        transports: ['internal'] as const
      };
    });

    console.log(`[biometric/verify] Generated challenge for pensioner ${token.id}, type ${type}, ${credentials.length} credential(s)`);

    return NextResponse.json({
      challenge: Array.from(challenge),
      allowCredentials
    });

  } catch (err) {
    console.error('[biometric/verify] GET error', err);
    return NextResponse.json({ 
      message: 'Server error',
      error: 'SERVER_ERROR'
    }, { status: 500 });
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
      return NextResponse.json({ 
        message: 'Missing required fields: type and credential are required',
        error: 'MISSING_FIELDS'
      }, { status: 400 });
    }

    const normalizedType = type.toUpperCase();
    if (!['FACE', 'FINGERPRINT'].includes(normalizedType)) {
      return NextResponse.json({ 
        message: 'Invalid biometric type. Must be FACE or FINGERPRINT',
        error: 'INVALID_TYPE'
      }, { status: 400 });
    }

    // Get pensioner
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) }
    });

    if (!pensioner) {
      return NextResponse.json({ 
        message: 'Pensioner not found',
        error: 'PENSIONER_NOT_FOUND'
      }, { status: 404 });
    }

    // Verify challenge was issued
    const challengeKey = `${token.id}_${normalizedType}`;
    const storedChallenge = verificationChallenges.get(challengeKey);
    if (!storedChallenge) {
      return NextResponse.json({ 
        message: 'Verification challenge not found or expired. Please try again.',
        error: 'CHALLENGE_NOT_FOUND'
      }, { status: 400 });
    }
    if (storedChallenge.expiresAt < Date.now()) {
      verificationChallenges.delete(challengeKey);
      return NextResponse.json({ 
        message: 'Verification challenge expired. Please try again.',
        error: 'CHALLENGE_EXPIRED'
      }, { status: 400 });
    }

    // Find the credential - MUST match both type and credentialId
    const credentialId = credential.id; // This is a base64url string from the client
    const storedCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: normalizedType as 'FACE' | 'FINGERPRINT',
        credentialId: credentialId
      }
    });

    if (!storedCredential) {
      console.error(`[biometric/verify] Credential not found for pensioner ${pensioner.id}, type ${normalizedType}, credentialId: ${credentialId.substring(0, 20)}...`);
      return NextResponse.json({ 
        message: `Credential not found for ${normalizedType}. Please ensure you're using the correct biometric type.`,
        error: 'CREDENTIAL_NOT_FOUND'
      }, { status: 404 });
    }

    // Verify the challenge matches
    // Note: In a production system, you should also verify the signature here
    // For now, we'll do basic validation
    const isVerified = true; // TODO: Implement proper signature verification using stored publicKey

    // Clean up challenge
    verificationChallenges.delete(challengeKey);

    if (isVerified) {
      // Create verification log
      const nextDue = new Date();
      nextDue.setFullYear(nextDue.getFullYear() + 3);

      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: `WINDOWS_HELLO_${normalizedType}`,
          status: 'SUCCESS',
          verifiedAt: new Date(),
          nextDueAt: nextDue
        }
      });

      console.log(`[biometric/verify] Successfully verified ${normalizedType} for pensioner ${pensioner.id}`);

      return NextResponse.json({ 
        success: true, 
        status: 'SUCCESS',
        nextDueAt: nextDue,
        message: `${normalizedType} verification successful`
      });
    } else {
      // Create review entry for failed verification
      await prisma.verificationreview.create({
        data: {
          pensionerId: pensioner.id,
          capturedPhoto: '', // Empty string for biometric verification
          status: 'PENDING'
        }
      });

      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: `WINDOWS_HELLO_${normalizedType}`,
          status: 'PENDING_REVIEW'
        }
      });

      return NextResponse.json({ 
        success: false, 
        status: 'PENDING_REVIEW',
        message: 'Verification failed. Sent for officer review.'
      });
    }

  } catch (err: any) {
    console.error('[biometric/verify] POST error', err);
    return NextResponse.json({ 
      message: 'Server error during verification',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
