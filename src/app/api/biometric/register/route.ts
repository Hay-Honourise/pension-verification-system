import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { randomBytes } from 'crypto';

// In-memory challenge storage (keyed by userId_type)
// In production, use Redis or similar for distributed systems
const registrationChallenges = new Map<string, { challenge: Buffer; expiresAt: number }>();

// Clean up expired challenges every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of registrationChallenges.entries()) {
    if (value.expiresAt < now) {
      registrationChallenges.delete(key);
    }
  }
}, 5 * 60 * 1000);

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
      return NextResponse.json({ message: 'Invalid biometric type. Must be FACE or FINGERPRINT' }, { status: 400 });
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

    // Generate challenge and store it per type
    const challenge = randomBytes(32);
    // Use different user IDs for FACE vs FINGERPRINT to force separate credentials
    // This helps Windows Hello distinguish between the two modalities
    const userIdBytes = new TextEncoder().encode(`${pensioner.id}_${type}`);
    const userName = `${pensioner.email}_${type}`;
    const userDisplayName = `${pensioner.fullName} (${type})`;

    // Store challenge with expiration (5 minutes)
    const challengeKey = `${pensioner.id}_${type}`;
    registrationChallenges.set(challengeKey, {
      challenge,
      expiresAt: Date.now() + 5 * 60 * 1000
    });

    console.log(`[biometric/register] Generated challenge for pensioner ${pensioner.id}, type ${type}`);

    return NextResponse.json({
      challenge: Array.from(challenge),
      userId: Array.from(userIdBytes),
      userName,
      userDisplayName,
      rpId: process.env.RP_ID || 'localhost'
    });

  } catch (err) {
    console.error('[biometric/register] GET error', err);
    return NextResponse.json({ message: 'Server error', error: 'SERVER_ERROR' }, { status: 500 });
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

    // Verify challenge was issued (optional but recommended)
    const challengeKey = `${pensioner.id}_${normalizedType}`;
    const storedChallenge = registrationChallenges.get(challengeKey);
    if (storedChallenge && storedChallenge.expiresAt < Date.now()) {
      registrationChallenges.delete(challengeKey);
      return NextResponse.json({ 
        message: 'Registration challenge expired. Please try again.',
        error: 'CHALLENGE_EXPIRED'
      }, { status: 400 });
    }

    // Store credentialId as base64url string (WebAuthn standard format)
    // credential.id is already a base64url string from the browser
    const credentialId = credential.id;

    // Store the credential with proper type separation
    await prisma.biometriccredential.create({
      data: {
        pensionerId: pensioner.id,
        type: normalizedType as 'FACE' | 'FINGERPRINT',
        credentialId: credentialId,
        publicKey: JSON.stringify(credential.response),
        registeredAt: new Date()
      }
    });

    // Clean up challenge
    registrationChallenges.delete(challengeKey);

    console.log(`[biometric/register] Successfully registered ${normalizedType} for pensioner ${pensioner.id}, credentialId: ${credentialId.substring(0, 20)}...`);

    return NextResponse.json({ 
      success: true, 
      message: `${normalizedType} registered successfully`,
      credentialId: credentialId
    });

  } catch (err: any) {
    console.error('[biometric/register] POST error', err);
    return NextResponse.json({ 
      message: 'Server error during registration',
      error: 'SERVER_ERROR',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
