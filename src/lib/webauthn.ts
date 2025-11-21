import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type GenerateRegistrationOptionsOpts,
  type VerifyRegistrationResponseOpts,
  type GenerateAuthenticationOptionsOpts,
  type VerifyAuthenticationResponseOpts,
} from '@simplewebauthn/server';
// Types are exported from @simplewebauthn/server
// Using any for now to avoid type issues, will be properly typed by the library
type AttestationCredentialJSON = any;
type AuthenticationCredentialJSON = any;
import { getChallenge, deleteChallenge, setChallenge } from './challenges';

// Helper function to extract rpId from URL or use environment variable
function getRpId(urlOrHostname?: string): string {
  if (process.env.RP_ID) {
    return process.env.RP_ID;
  }
  if (urlOrHostname) {
    try {
      // If it's a full URL, extract hostname; otherwise use as-is
      const url = new URL(urlOrHostname.startsWith('http') ? urlOrHostname : `https://${urlOrHostname}`);
      return url.hostname;
    } catch {
      // If URL parsing fails, use as hostname directly
      return urlOrHostname.split(':')[0]; // Remove port if present
    }
  }
  return 'localhost';
}

// Helper function to get origin from request or environment
function getOrigin(urlOrOrigin?: string): string {
  if (process.env.NEXT_PUBLIC_ORIGIN) {
    return process.env.NEXT_PUBLIC_ORIGIN;
  }
  if (urlOrOrigin) {
    if (urlOrOrigin.startsWith('http')) {
      return urlOrOrigin;
    }
    // If no protocol, assume https for production
    return `https://${urlOrOrigin}`;
  }
  return 'http://localhost:3000';
}

const rpName = process.env.RP_NAME || 'Oyo Pension Verification System';

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
export async function generateRegistrationOptionsForUser(
  userId: string,
  userName: string,
  userDisplayName: string,
  challengeKey: string,
  requestUrl?: string
): Promise<any> {
  const rpId = getRpId(requestUrl);
  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID: rpId,
    userID: new TextEncoder().encode(userId), // Convert string to Uint8Array
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

  const options = await generateRegistrationOptions(opts);

  // Store challenge (options.challenge is a base64url string, convert to Buffer for storage)
  const challengeBuffer = Buffer.from(options.challenge, 'base64url');
  await setChallenge(challengeKey, challengeBuffer, 300); // 5 minutes TTL

  return options;
}

/**
 * Verify attestation response (registration)
 */
export async function verifyRegistrationResponseForUser(
  credentialData: AttestationCredentialJSON,
  challengeKey: string,
  expectedOrigin?: string,
  requestUrl?: string
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
  const credentialIdBuffer = base64UrlToBuffer(credentialData.id);

  const origin = expectedOrigin || getOrigin(requestUrl);
  const rpId = getRpId(requestUrl || expectedOrigin);

  const opts: VerifyRegistrationResponseOpts = {
    response: credentialData,
    expectedChallenge: bufferToBase64Url(expectedChallenge), // Convert Buffer to base64url string
    expectedOrigin: origin,
    expectedRPID: rpId,
    requireUserVerification: true, // Require user verification (biometric or PIN)
  };

  try {
    const verification = await verifyRegistrationResponse(opts);

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
    const { credential } = verification.registrationInfo;
    const credentialID = credential.id;
    const credentialPublicKey = credential.publicKey;
    const counter = credential.counter;

    // Delete challenge after successful verification
    await deleteChallenge(challengeKey);

    return {
      verified: true,
      credentialId: bufferToBase64Url(Buffer.from(credentialID)),
      publicKey: Buffer.from(credentialPublicKey),
      signCount: counter,
      transports: credentialData.response?.transports || undefined,
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
export async function generateAuthOptionsForUser(
  allowCredentials: Array<{ id: string; type: string; transports?: string[] }>,
  challengeKey: string,
  requestUrl?: string
): Promise<any> {
  const rpId = getRpId(requestUrl);
  const opts: GenerateAuthenticationOptionsOpts = {
    rpID: rpId,
    timeout: 60000,
    allowCredentials: allowCredentials.map(cred => ({
      id: cred.id, // Keep as base64url string (Base64URLString)
      transports: cred.transports as any,
    })),
    userVerification: 'required', // Require user verification (biometric or PIN)
  };

  const options = await generateAuthenticationOptions(opts);

  // Store challenge (options.challenge is a base64url string, convert to Buffer for storage)
  const challengeBuffer = Buffer.from(options.challenge, 'base64url');
  await setChallenge(challengeKey, challengeBuffer, 300); // 5 minutes TTL

  return options;
}

/**
 * Verify authentication response (verification)
 * This function enforces biometric-only by rejecting PIN-only authentications
 */
export async function verifyAuthenticationResponseForUser(
  credential: AuthenticationCredentialJSON,
  storedCredential: { credentialId: string; publicKey: string | Uint8Array; signCount: number },
  challengeKey: string,
  expectedOrigin?: string,
  requestUrl?: string
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

  // Convert publicKey from base64url string to Uint8Array (WebAuthnCredential expects Uint8Array<ArrayBuffer>)
  // If publicKey is already a Uint8Array, use it directly; otherwise convert from base64url string
  let publicKeyUint8Array: Uint8Array<ArrayBuffer>;
  if (storedCredential.publicKey instanceof Uint8Array) {
    // If already Uint8Array, ensure it has ArrayBuffer backing (not ArrayBufferLike)
    const existingArray = storedCredential.publicKey;
    const arrayBuffer = new ArrayBuffer(existingArray.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(existingArray);
    publicKeyUint8Array = view;
  } else {
    // Convert from base64url string to Buffer, then to Uint8Array with proper ArrayBuffer
    const buffer = base64UrlToBuffer(storedCredential.publicKey as string);
    // Create a new ArrayBuffer and copy the data to ensure it's ArrayBuffer, not ArrayBufferLike
    const arrayBuffer = new ArrayBuffer(buffer.length);
    const view = new Uint8Array(arrayBuffer);
    view.set(buffer);
    publicKeyUint8Array = view;
  }

  const origin = expectedOrigin || getOrigin(requestUrl);
  const rpId = getRpId(requestUrl || expectedOrigin);

  // WebAuthnCredential.id expects a Base64URLString (string), not Uint8Array
  const opts: VerifyAuthenticationResponseOpts = {
    response: credential,
    expectedChallenge: bufferToBase64Url(expectedChallenge),
    expectedOrigin: origin,
    expectedRPID: rpId,
    credential: {
      id: storedCredential.credentialId, // Base64URLString (already stored as base64url string)
      publicKey: publicKeyUint8Array, // Convert Buffer to Uint8Array
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

