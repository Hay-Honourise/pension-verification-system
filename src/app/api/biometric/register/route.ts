import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { generateRegistrationOptions, verifyRegistrationResponse, bufferToBase64Url } from '@/lib/webauthn';

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

    // Get pensioner info
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(token.id) },
      select: { id: true, fullName: true, email: true }
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Check if already registered
    const existingCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: type as 'FACE' | 'FINGERPRINT'
      }
    });

    if (existingCredential) {
      return NextResponse.json({ 
        message: `${type} already registered. Please delete the existing credential first.`,
        error: 'ALREADY_REGISTERED'
      }, { status: 400 });
    }

    // Generate attestation options using @simplewebauthn/server
    const userId = `${pensioner.id}_${type}`;
    const userName = `${pensioner.email}_${type}`;
    const userDisplayName = `${pensioner.fullName} (${type})`;
    const challengeKey = `${pensioner.id}_${type}_reg`;

    const attestationOptions = await generateRegistrationOptions(
      userId,
      userName,
      userDisplayName,
      challengeKey
    );

    console.log(`[biometric/register] Generated attestation options for pensioner ${pensioner.id}, type ${type}`);

    const response = NextResponse.json(attestationOptions);
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (err: any) {
    console.error('[biometric/register] GET error', err);
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

    // Check if already registered
    const existingCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: normalizedType as 'FACE' | 'FINGERPRINT'
      }
    });

    if (existingCredential) {
      return NextResponse.json({ 
        message: `${normalizedType} already registered. Please delete the existing credential first.`,
        error: 'ALREADY_REGISTERED'
      }, { status: 400 });
    }

    // Verify attestation response
    const challengeKey = `${pensioner.id}_${normalizedType}_reg`;
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000';
    
    const verification = await verifyRegistrationResponse(
      credential,
      challengeKey,
      origin
    );

    if (!verification.verified) {
      console.error(`[biometric/register] Verification failed: ${verification.error}`);
      
      if (verification.error === 'CHALLENGE_EXPIRED') {
        return NextResponse.json({ 
          message: 'Registration challenge expired. Please try again.',
          error: 'CHALLENGE_EXPIRED'
        }, { status: 400 });
      }

      if (verification.error === 'PIN_NOT_ALLOWED' || verification.error?.includes('PIN')) {
        return NextResponse.json({ 
          message: 'PIN-based registration is not allowed. Please use a biometric-enabled device or select another method.',
          error: 'PIN_NOT_ALLOWED'
        }, { status: 400 });
      }

      return NextResponse.json({ 
        message: 'Registration verification failed. Please try again.',
        error: verification.error || 'VERIFICATION_FAILED'
      }, { status: 400 });
    }

    // Store the credential
    const transportsJson = verification.transports ? JSON.stringify(verification.transports) : null;
    
    await prisma.biometriccredential.create({
      data: {
        pensionerId: pensioner.id,
        type: normalizedType as 'FACE' | 'FINGERPRINT',
        credentialId: verification.credentialId,
        publicKey: bufferToBase64Url(verification.publicKey), // Store as base64url
        signCount: verification.signCount,
        transports: transportsJson,
        registeredAt: new Date()
      }
    });

    console.log(`[biometric/register] Successfully registered ${normalizedType} for pensioner ${pensioner.id}, credentialId: ${verification.credentialId.substring(0, 20)}...`);

    const response = NextResponse.json({ 
      success: true, 
      message: `${normalizedType} registered successfully`,
      credentialId: verification.credentialId
    });
    response.headers.set('Cache-Control', 'no-store');
    return response;

  } catch (err: any) {
    console.error('[biometric/register] POST error', err);
    return NextResponse.json({ 
      message: 'Server error during registration',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
