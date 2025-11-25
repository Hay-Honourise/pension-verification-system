import { NextRequest, NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { storeChallenge } from '@/lib/webauthn-challenge-store';
import { getOrigin, getRpId, getRpName, WEB_AUTHN_TIMEOUT_MS } from '@/lib/webauthn-config';

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

    const { searchParams } = new URL(request.url);
    const type = normalizeType(searchParams.get('type')) ?? 'FACE';

    const pensioner = await prisma.pensioner.findUnique({
      where: { id: Number(payload.id) },
      select: {
        id: true,
        email: true,
        fullName: true,
      },
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    const existing = await prisma.biometriccredential.findFirst({
      where: {
        pensionerId: pensioner.id,
        type,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message: `${type} already registered. Remove the existing passkey to register again.`,
          error: 'ALREADY_REGISTERED',
        },
        { status: 400 },
      );
    }

    const credentialDisplayName = pensioner.fullName || pensioner.email || `Pensioner ${pensioner.id}`;
    const userHandle = new TextEncoder().encode(String(pensioner.id));
    const options = await generateRegistrationOptions({
      rpID: getRpId(),
      rpName: getRpName(),
      userID: userHandle,
      userName: pensioner.email || `pensioner-${pensioner.id}`,
      userDisplayName: credentialDisplayName,
      timeout: WEB_AUTHN_TIMEOUT_MS,
      attestationType: 'none',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        residentKey: 'required',
        requireResidentKey: true,
        userVerification: 'required',
      },
      supportedAlgorithmIDs: [-7, -257],
      excludeCredentials: [],
    });

    const challengeKey = `${pensioner.id}_${type}_register`;
    await storeChallenge(challengeKey, options.challenge);

    console.log(
      `[biometric/register] Issued discoverable registration challenge for pensioner=${pensioner.id} type=${type}`,
    );

    const response = NextResponse.json({ options, type, origin: getOrigin() });
    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[biometric/register] GET error', error);
    return NextResponse.json(
      {
        message: 'Unable to start biometric registration',
        error: 'SERVER_ERROR',
      },
      { status: 500 },
    );
  }
}
