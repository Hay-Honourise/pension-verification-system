import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateAuthOptionsForUser, verifyAuthenticationResponseForUser, base64UrlToBuffer } from '@/lib/webauthn';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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

    // Prepare allowCredentials for @simplewebauthn/server
    const allowCredentials = credentials.map(cred => {
      let transports: string[] | undefined;
      if (cred.transports) {
        try {
          transports = JSON.parse(cred.transports);
        } catch {
          transports = ['internal'];
        }
      } else {
        transports = ['internal'];
      }

      return {
        id: cred.credentialId, // base64url string
        type: 'public-key',
        transports
      };
    });

    // Generate authentication options
    const challengeKey = `${token.id}_${type}_auth`;
    const requestUrl = request.url;
    const authOptions = await generateAuthOptionsForUser(allowCredentials, challengeKey, requestUrl);

    console.log(`[biometric/verify] Generated authentication options for pensioner ${token.id}, type ${type}, ${credentials.length} credential(s)`);

    const response = NextResponse.json(authOptions);
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (err: any) {
    console.error('[biometric/verify] GET error', err);
    return NextResponse.json({ 
      message: 'Server error',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

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

    // Verify authentication response
    const challengeKey = `${pensioner.id}_${normalizedType}_auth`;
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
    const requestUrl = request.url;
    
    // Convert stored publicKey from base64url back to Uint8Array
    const publicKeyUint8Array = new Uint8Array(base64UrlToBuffer(storedCredential.publicKey));

    const verification = await verifyAuthenticationResponseForUser(
      credential,
      {
        credentialId: storedCredential.credentialId,
        publicKey: publicKeyUint8Array,
        signCount: storedCredential.signCount
      },
      challengeKey,
      origin,
      requestUrl
    );

    if (!verification.verified) {
      console.error(`[biometric/verify] Verification failed: ${verification.error}`);

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

      if (verification.error === 'PIN_NOT_ALLOWED') {
        return NextResponse.json({ 
          success: false,
          status: 'PENDING_REVIEW',
          message: 'PIN not allowed — please use fingerprint/face. Verification sent for officer review.',
          error: 'PIN_NOT_ALLOWED'
        }, { status: 400 });
      }

      if (verification.error === 'CHALLENGE_EXPIRED') {
        return NextResponse.json({ 
          message: 'Verification challenge expired. Please try again.',
          error: 'CHALLENGE_EXPIRED'
        }, { status: 400 });
      }

      return NextResponse.json({ 
        success: false,
        status: 'PENDING_REVIEW',
        message: 'Verification failed. Sent for officer review.',
        error: verification.error || 'VERIFICATION_FAILED'
      }, { status: 400 });
    }

    // Update signCount to prevent replay attacks
    await prisma.biometriccredential.update({
      where: { id: storedCredential.id },
      data: { signCount: verification.signCount }
    });

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

    console.log(`[biometric/verify] Successfully verified ${normalizedType} for pensioner ${pensioner.id} (userVerified: ${verification.userVerified})`);

    const response = NextResponse.json({ 
      success: true, 
      status: 'SUCCESS',
      nextDueAt: nextDue,
      message: `${normalizedType} verification successful`
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (err: any) {
    console.error('[biometric/verify] POST error', err);
    return NextResponse.json({ 
      message: 'Server error during verification',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
