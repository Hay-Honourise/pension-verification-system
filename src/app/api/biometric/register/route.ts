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

    let pensioner;
    try {
      pensioner = await prisma.pensioner.findUnique({
        where: { id: Number(payload.id) },
        select: {
          id: true,
          email: true,
          fullName: true,
        },
      });
    } catch (dbError) {
      console.error('[biometric/register] Database error fetching pensioner', dbError);
      return NextResponse.json(
        {
          message: 'Database error',
          error: 'DATABASE_ERROR',
        },
        { status: 500 },
      );
    }

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    let existing;
    try {
      existing = await prisma.biometriccredential.findFirst({
        where: {
          pensionerId: pensioner.id,
          type,
        },
      });
    } catch (dbError) {
      console.error('[biometric/register] Database error checking existing credentials', dbError);
      return NextResponse.json(
        {
          message: 'Database error',
          error: 'DATABASE_ERROR',
        },
        { status: 500 },
      );
    }

    if (existing) {
      return NextResponse.json(
        {
          message: `${type} already registered. Remove the existing passkey to register again.`,
          error: 'ALREADY_REGISTERED',
        },
        { status: 400 },
      );
    }

    const rpId = getRpId();
    const rpName = getRpName();
    const origin = getOrigin();
    
    // Validate configuration
    if (!rpId || rpId.trim() === '') {
      console.error('[biometric/register] RP_ID not configured');
      return NextResponse.json(
        {
          message: 'Server configuration error: RP_ID environment variable not set',
          error: 'CONFIG_ERROR',
        },
        { status: 500 },
      );
    }
    
    if (!origin || origin.trim() === '') {
      console.error('[biometric/register] ORIGIN not configured');
      return NextResponse.json(
        {
          message: 'Server configuration error: ORIGIN environment variable not set',
          error: 'CONFIG_ERROR',
        },
        { status: 500 },
      );
    }
    
    console.log(`[biometric/register] Using RP_ID=${rpId}, ORIGIN=${origin}, RP_NAME=${rpName}`);

    const credentialDisplayName = pensioner.fullName || pensioner.email || `Pensioner ${pensioner.id}`;
    const userHandle = new TextEncoder().encode(String(pensioner.id));
    
    try {
      const options = await generateRegistrationOptions({
        rpID: rpId,
        rpName: rpName,
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
      try {
        await storeChallenge(challengeKey, options.challenge);
        console.log(
          `[biometric/register] Stored registration challenge in Redis: key=${challengeKey} for pensioner=${pensioner.id} type=${type}`,
        );
      } catch (storeError) {
        console.error('[biometric/register] Error storing challenge in Redis', storeError);
        throw new Error(`Failed to store challenge: ${storeError instanceof Error ? storeError.message : 'Unknown error'}`);
      }

      console.log(
        `[biometric/register] Issued discoverable registration challenge for pensioner=${pensioner.id} type=${type}`,
      );

      const response = NextResponse.json({ options, type, origin: getOrigin() });
      response.headers.set('Cache-Control', 'no-store');
      return response;
    } catch (genError) {
      console.error('[biometric/register] generateRegistrationOptions error', genError);
      throw genError;
    }
  } catch (error) {
    console.error('[biometric/register] GET error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[biometric/register] Error details:', { errorMessage, errorStack });
    return NextResponse.json(
      {
        message: 'Unable to start biometric registration',
        error: 'SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 },
    );
  }
}
