import {
  generateAttestationOptions,
  verifyAttestationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateAttestationOptionsOpts,
  type VerifyAttestationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
// Types are exported from @simplewebauthn/server
// Using any for now to avoid type issues, will be properly typed by the library
type AttestationCredentialJSON = any;
type AuthenticationCredentialJSON = any;
import { getChallenge, deleteChallenge } from './challenges';

const rpId = process.env.RP_ID || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
const rpName = process.env.RP_NAME || 'Oyo Pension Verification System';
const origin = process.env.NEXT_PUBLIC_ORIGIN || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

/**
 * Convert base64url string to Buffer
 */
export function base64UrlToBuffer(base64url: string): Buffer {
  // Convert base64url to base64
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Convert Buffer to base64url string
 */
export function bufferToBase64Url(buffer: Buffer | Uint8Array): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate attestation options for registration
 */
export async function generateRegistrationOptions(
  userId: string,
  userName: string,
  userDisplayName: string,
  challengeKey: string
): Promise<any> {
  const opts: GenerateAttestationOptionsOpts = {
    rpName,
    rpID: rpId,
    userID: Buffer.from(userId),
    userName,
    userDisplayName,
    timeout: 60000,
    attestationType: 'direct',
    /**
     * The `authenticatorSelection` option allows us to specify:
     * - `authenticatorAttachment: 'platform'` - Only use built-in authenticators (Windows Hello, Touch ID, etc.)
     * - `userVerification: 'required'` - Require user verification (biometric or PIN)
     * 
     * Note: We cannot force Windows Hello to use face vs fingerprint, but we can enforce
     * that user verification occurred (not just presence). The server will reject PIN-only
     * authentications by checking the `userVerified` flag in the response.
     */
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      requireResidentKey: false,
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
  };

  const options = await generateAttestationOptions(opts);

  // Store challenge
  const challengeBuffer = base64UrlToBuffer(options.challenge);
  await setChallenge(challengeKey, challengeBuffer, 300); // 5 minutes TTL

  return options;
}

/**
 * Verify attestation response (registration)
 */
export async function verifyRegistrationResponse(
  credential: AttestationCredentialJSON,
  challengeKey: string,
  expectedOrigin: string = origin
): Promise<{ verified: boolean; credentialId: string; publicKey: Buffer; signCount: number; transports?: string[]; error?: string }> {
  // Get stored challenge
  const expectedChallenge = await getChallenge(challengeKey);
  if (!expectedChallenge) {
    return {
      verified: false,
      credentialId: '',
      publicKey: Buffer.alloc(0),
      signCount: 0,
      error: 'CHALLENGE_EXPIRED',
    };
  }

  // Convert credential ID from base64url to Buffer
  const credentialIdBuffer = base64UrlToBuffer(credential.id);

  const opts: VerifyAttestationResponseOpts = {
    response: credential,
    expectedChallenge: bufferToBase64Url(expectedChallenge),
    expectedOrigin,
    expectedRPID: rpId,
    requireUserVerification: true, // Require user verification (biometric or PIN)
  };

  try {
    const verification = await verifyAttestationResponse(opts);

    if (!verification.verified) {
      return {
        verified: false,
        credentialId: '',
        publicKey: Buffer.alloc(0),
        signCount: 0,
        error: 'VERIFICATION_FAILED',
      };
    }

    // Check if user verification actually occurred
    // The library's `verified` flag means the signature is valid, but we need to check
    // if user verification (biometric/PIN) was actually used
    if (!verification.registrationInfo) {
      return {
        verified: false,
        credentialId: '',
        publicKey: Buffer.alloc(0),
        signCount: 0,
        error: 'NO_REGISTRATION_INFO',
      };
    }

    // Extract credential info
    const { credentialID, credentialPublicKey, counter, fmt } = verification.registrationInfo;

    // Delete challenge after successful verification
    await deleteChallenge(challengeKey);

    return {
      verified: true,
      credentialId: bufferToBase64Url(Buffer.from(credentialID)),
      publicKey: Buffer.from(credentialPublicKey),
      signCount: counter,
      transports: credential.response.transports,
    };
  } catch (error: any) {
    console.error('[webauthn] Registration verification error:', error);
    return {
      verified: false,
      credentialId: '',
      publicKey: Buffer.alloc(0),
      signCount: 0,
      error: error.message || 'VERIFICATION_ERROR',
    };
  }
}

/**
 * Generate authentication options for verification
 */
export async function generateAuthOptions(
  allowCredentials: Array<{ id: string; type: string; transports?: string[] }>,
  challengeKey: string
): Promise<any> {
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: rpId,
    timeout: 60000,
    allowCredentials: allowCredentials.map(cred => ({
      id: base64UrlToBuffer(cred.id),
      type: 'public-key',
      transports: cred.transports as any,
    })),
    userVerification: 'required', // Require user verification (biometric or PIN)
  };

  const options = await generateAuthenticationOptions(opts);

  // Store challenge
  const challengeBuffer = base64UrlToBuffer(options.challenge);
  await setChallenge(challengeKey, challengeBuffer, 300); // 5 minutes TTL

  return options;
}

/**
 * Verify authentication response (verification)
 * This function enforces biometric-only by rejecting PIN-only authentications
 */
export async function verifyAuthenticationResponse(
  credential: AuthenticationCredentialJSON,
  storedCredential: { credentialId: string; publicKey: Buffer; signCount: number },
  challengeKey: string,
  expectedOrigin: string = origin
): Promise<{ verified: boolean; signCount: number; error?: string; userVerified?: boolean }> {
  // Get stored challenge
  const expectedChallenge = await getChallenge(challengeKey);
  if (!expectedChallenge) {
    return {
      verified: false,
      signCount: storedCredential.signCount,
      error: 'CHALLENGE_EXPIRED',
    };
  }

  // Convert credential ID from base64url to Buffer
  const credentialIdBuffer = base64UrlToBuffer(credential.id);

  const opts: VerifyAuthenticationResponseOpts = {
    response: credential,
    expectedChallenge: bufferToBase64Url(expectedChallenge),
    expectedOrigin,
    expectedRPID: rpId,
    credential: {
      id: credentialIdBuffer,
      publicKey: storedCredential.publicKey,
      counter: storedCredential.signCount,
    },
    requireUserVerification: true, // Require user verification
  };

  try {
    const verification = await verifyAuthenticationResponse(opts);

    if (!verification.verified) {
      return {
        verified: false,
        signCount: storedCredential.signCount,
        error: 'VERIFICATION_FAILED',
        userVerified: false,
      };
    }

    // CRITICAL: Check if user verification actually occurred
    // The `authenticatorInfo.userVerified` flag indicates whether user verification (biometric/PIN) was used
    // If false, it means only user presence was checked (not allowed in our system)
    const userVerified = verification.authenticationInfo?.userVerified ?? false;

    if (!userVerified) {
      console.warn('[webauthn] Authentication rejected: user verification not performed (PIN-only or presence-only)');
      return {
        verified: false,
        signCount: storedCredential.signCount,
        error: 'PIN_NOT_ALLOWED',
        userVerified: false,
      };
    }

    // Check sign count to prevent replay attacks
    const newSignCount = verification.authenticationInfo?.newCounter ?? storedCredential.signCount;
    if (newSignCount <= storedCredential.signCount) {
      console.warn('[webauthn] Authentication rejected: sign count not increased (possible replay attack)');
      return {
        verified: false,
        signCount: storedCredential.signCount,
        error: 'INVALID_SIGN_COUNT',
        userVerified: true,
      };
    }

    // Delete challenge after successful verification
    await deleteChallenge(challengeKey);

    return {
      verified: true,
      signCount: newSignCount,
      userVerified: true,
    };
  } catch (error: any) {
    console.error('[webauthn] Authentication verification error:', error);
    return {
      verified: false,
      signCount: storedCredential.signCount,
      error: error.message || 'VERIFICATION_ERROR',
      userVerified: false,
    };
  }
}

// Re-export setChallenge for convenience
export { setChallenge } from './challenges';

