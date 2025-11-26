import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { clearChallenge, loadChallenge } from '@/lib/webauthn-challenge-store';
import { getOrigin, getRpId } from '@/lib/webauthn-config';

const SUPPORTED_TYPES = new Set(['FACE', 'FINGERPRINT']);

function normalizeType(value?: string | null): 'FACE' | 'FINGERPRINT' | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return SUPPORTED_TYPES.has(upper as 'FACE' | 'FINGERPRINT') ? (upper as 'FACE' | 'FINGERPRINT') : null;
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!bearer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(bearer);
    if (!payload?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attestation, type } = await request.json();
    const normalizedType = normalizeType(type) ?? 'FACE';

    if (!attestation) {
      return NextResponse.json({ error: 'MISSING_ATTESTATION', message: 'Attestation response is required' }, { status: 400 });
    }

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(payload.id) },
    });

    if (!pensioner) {
      return NextResponse.json({ error: 'PENSIONER_NOT_FOUND' }, { status: 404 });
    }

    const existing = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: normalizedType,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'ALREADY_REGISTERED',
          message: `${normalizedType} already registered. Remove the existing passkey to register again.`,
        },
        { status: 400 },
      );
    }

    const challengeKey = `${pensioner.id}_${normalizedType}_register`;
    console.log(`[biometric/register/verify] Loading challenge from Redis: key=${challengeKey}`);
    const expectedChallenge = await loadChallenge(challengeKey);
    if (!expectedChallenge) {
      console.warn(`[biometric/register/verify] Challenge not found in Redis: key=${challengeKey}`);
      return NextResponse.json(
        { error: 'CHALLENGE_EXPIRED', message: 'Registration challenge expired. Please restart registration.' },
        { status: 400 },
      );
    }

    const verification = await verifyRegistrationResponse({
      response: attestation,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
      requireUserVerification: true,
    });

    if (!verification.verified || !verification.registrationInfo) {
      console.warn('[biometric/register] Registration verification failed', verification);
      return NextResponse.json(
        { error: 'VERIFICATION_FAILED', message: 'Unable to verify biometric registration' },
        { status: 400 },
      );
    }

    const { registrationInfo } = verification;
    const credentialId = Buffer.from(registrationInfo.credential.id).toString('base64url');
    const publicKey = Buffer.from(registrationInfo.credential.publicKey).toString('base64url');
    const transports = Array.isArray(attestation?.response?.transports)
      ? JSON.stringify(attestation.response.transports)
      : null;

    await prisma.biometriccredential.create({
      data: {
        pensionerId: pensioner.id,
        type: normalizedType,
        credentialId,
        publicKey,
        signCount: registrationInfo.credential.counter ?? 0,
        transports,
      },
    });

    await clearChallenge(challengeKey);
    console.log(`[biometric/register/verify] Cleared challenge from Redis: key=${challengeKey}`);

    console.log(
      `[biometric/register] Stored discoverable credential for pensioner=${pensioner.id} type=${normalizedType} cred=${credentialId.slice(0, 10)}…`,
    );

    return NextResponse.json({ success: true, credentialId });
  } catch (error) {
    console.error('[biometric/register] verify error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Unable to verify biometric registration' }, { status: 500 });
  }
}

