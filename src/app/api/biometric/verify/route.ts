import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';
import type { AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { clearChallenge, loadChallenge, storeChallenge } from '@/lib/webauthn-challenge-store';
import { getOrigin, getRpId, WEB_AUTHN_TIMEOUT_MS } from '@/lib/webauthn-config';

const SUPPORTED_TYPES = new Set(['FACE', 'FINGERPRINT']);

function normalizeType(value?: string | null): 'FACE' | 'FINGERPRINT' | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  return SUPPORTED_TYPES.has(upper as 'FACE' | 'FINGERPRINT') ? (upper as 'FACE' | 'FINGERPRINT') : null;
}

export async function GET(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(bearer);
    if (!payload?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const type = normalizeType(new URL(request.url).searchParams.get('type')) ?? 'FACE';

    const credentialCount = await prisma.biometriccredential.count({
      where: { pensionerId: Number(payload.id), type },
    });

    if (credentialCount === 0) {
      return NextResponse.json(
        {
          error: 'NO_CREDENTIALS',
          message: `No ${type} passkeys registered. Please register before verifying.`,
        },
        { status: 404 },
      );
    }

    const options = await generateAuthenticationOptions({
      rpID: getRpId(),
      timeout: WEB_AUTHN_TIMEOUT_MS,
      userVerification: 'required',
      allowCredentials: [],
    });

    const challengeKey = `${payload.id}_${type}_verify`;
    await storeChallenge(challengeKey, options.challenge);
    console.log(
      `[biometric/verify] Stored verification challenge in Redis: key=${challengeKey} for pensioner=${payload.id} type=${type}`,
    );

    console.log(
      `[biometric/verify] Issued discoverable authentication challenge for pensioner=${payload.id} type=${type}`,
    );

    const response = NextResponse.json({ options, type });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[biometric/verify] GET error', error);
    return NextResponse.json({ message: 'Unable to start biometric verification', error: 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(bearer);
    if (!payload?.id) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { assertion, type } = await request.json();
    const normalizedType = normalizeType(type) ?? 'FACE';

    if (!assertion?.id) {
      return NextResponse.json(
        { error: 'MISSING_ASSERTION', message: 'Verification payload missing. Please retry.' },
        { status: 400 },
      );
    }

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(payload.id) },
    });

    if (!pensioner) {
      return NextResponse.json({ error: 'PENSIONER_NOT_FOUND' }, { status: 404 });
    }

    const storedCredential = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type: normalizedType,
        credentialId: assertion.id,
      },
    });

    if (!storedCredential) {
      return NextResponse.json(
        { error: 'CREDENTIAL_NOT_FOUND', message: 'No matching passkey found for this device.' },
        { status: 404 },
      );
    }

    const challengeKey = `${pensioner.id}_${normalizedType}_verify`;
    console.log(`[biometric/verify] Loading challenge from Redis: key=${challengeKey}`);
    const expectedChallenge = await loadChallenge(challengeKey);
    if (!expectedChallenge) {
      console.warn(`[biometric/verify] Challenge not found in Redis: key=${challengeKey}`);
      return NextResponse.json(
        { error: 'CHALLENGE_EXPIRED', message: 'Verification challenge expired. Please try again.' },
        { status: 400 },
      );
    }

    let transports: AuthenticatorTransportFuture[] | undefined;
    if (storedCredential.transports) {
      try {
        const parsed = JSON.parse(storedCredential.transports);
        transports = Array.isArray(parsed) ? (parsed as AuthenticatorTransportFuture[]) : undefined;
      } catch {
        transports = undefined;
      }
    }

    const credential = {
      id: storedCredential.credentialId,
      publicKey: new Uint8Array(Buffer.from(storedCredential.publicKey, 'base64url')),
      counter: storedCredential.signCount,
      transports,
    };

    const verification = await verifyAuthenticationResponse({
      response: assertion,
      expectedChallenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpId(),
      credential,
      requireUserVerification: true,
    });

    if (!verification.verified) {
      await prisma.$transaction([
        prisma.verificationreview.create({
          data: {
            pensionerId: pensioner.id,
            capturedPhoto: '',
            status: 'PENDING',
          },
        }),
        prisma.verificationlog.create({
          data: {
            pensionerId: pensioner.id,
            method: `WINDOWS_HELLO_${normalizedType}`,
            status: 'PENDING_REVIEW',
          },
        }),
      ]);

      return NextResponse.json(
        {
          success: false,
          status: 'PENDING_REVIEW',
          message: 'Verification failed. An officer will review your submission.',
          error: 'VERIFICATION_FAILED',
        },
        { status: 400 },
      );
    }

    const newCounter = verification.authenticationInfo?.newCounter ?? storedCredential.signCount;
    await prisma.biometriccredential.update({
      where: { id: storedCredential.id },
      data: { signCount: newCounter },
    });

    const nextDue = new Date();
    nextDue.setMonth(nextDue.getMonth() + 3);

    await prisma.$transaction([
      prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: `WINDOWS_HELLO_${normalizedType}`,
          status: 'SUCCESS',
          verifiedAt: new Date(),
          nextDueAt: nextDue,
        },
      }),
      prisma.pensioner.update({
        where: { id: pensioner.id },
        data: {
          nextDueAt: nextDue,
          hasSeenDueNotification: false,
        },
      }),
    ]);

    await clearChallenge(challengeKey);
    console.log(`[biometric/verify] Cleared challenge from Redis: key=${challengeKey}`);

    console.log(
      `[biometric/verify] Pensioner=${pensioner.id} verified via ${normalizedType}. Next due ${nextDue.toISOString()}`,
    );

    return NextResponse.json({
      success: true,
      status: 'SUCCESS',
      nextDueAt: nextDue.toISOString(),
      message: `${normalizedType} verification successful`,
    });
  } catch (error) {
    console.error('[biometric/verify] POST error', error);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Unable to complete biometric verification' }, { status: 500 });
  }
}
