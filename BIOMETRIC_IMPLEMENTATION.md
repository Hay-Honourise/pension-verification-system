# Biometric-Only WebAuthn Implementation

This document describes the biometric-only enforcement implementation for WebAuthn (Windows Hello) across the pension verification system.

## Overview

The system now enforces biometric-only authentication by:
1. Requiring platform authenticators (Windows Hello, Touch ID, Face ID)
2. Rejecting PIN-only authentications on the server side
3. Detecting device capabilities and showing appropriate UI messages
4. Using Redis for challenge storage (with in-memory fallback)

## Key Features

### Biometric-Only Enforcement

- **Server-side validation**: The server checks the `userVerified` flag in the authentication response
- **PIN rejection**: If `userVerified` is `false`, the authentication is rejected with error `PIN_NOT_ALLOWED`
- **Sign count tracking**: Prevents replay attacks by tracking and validating sign counts

### Device Capability Detection

- **Platform detection**: Detects Windows, iOS, and Android devices
- **Modality detection**: Best-effort detection of face vs fingerprint support
- **UI adaptation**: Hides unavailable options and shows helpful messages

### Challenge Storage

- **Redis-based**: Uses Redis for distributed challenge storage (production)
- **In-memory fallback**: Falls back to in-memory storage if Redis is unavailable
- **TTL**: Challenges expire after 5 minutes (300 seconds)

## Architecture

### Backend Components

1. **`src/lib/challenges.ts`**: Redis-based challenge storage with in-memory fallback
2. **`src/lib/webauthn.ts`**: WebAuthn server helpers using `@simplewebauthn/server`
3. **`src/app/api/biometric/register/route.ts`**: Registration endpoint
4. **`src/app/api/biometric/verify/route.ts`**: Verification endpoint with biometric-only enforcement

### Frontend Components

1. **`src/lib/biometric-client.ts`**: Client-side helpers for device detection
2. **`src/app/pensioner/verification/page.tsx`**: UI with capability detection and error handling

## Database Schema

The `biometriccredential` model has been updated with:

```prisma
model biometriccredential {
  id           String    @id @default(cuid())
  pensionerId  Int
  type         String    // "FACE" | "FINGERPRINT"
  credentialId String   @unique
  publicKey    String    // Base64url encoded public key
  signCount    Int       @default(0)
  transports   String?   // JSON array of transport methods
  registeredAt  DateTime  @default(now())
  // ...
}
```

## Environment Variables

Add these to your `.env.local`:

```env
# WebAuthn Configuration
RP_ID=localhost  # Or your domain (e.g., pension-verification.oyo.gov.ng)
RP_NAME=Oyo Pension Verification System
NEXT_PUBLIC_ORIGIN=http://localhost:3000  # Or your production URL

# Redis (optional, falls back to in-memory if not set)
REDIS_URL=redis://localhost:6379
```

## How Biometric-Only Enforcement Works

### Registration Flow

1. Client requests registration options from `/api/biometric/register?type=FACE`
2. Server generates attestation options with:
   - `authenticatorAttachment: 'platform'` (only built-in authenticators)
   - `userVerification: 'required'` (requires biometric or PIN)
3. Client creates credential using `navigator.credentials.create()`
4. Server verifies attestation response:
   - Validates signature
   - Checks that user verification occurred
   - Stores credential with `publicKey` and `signCount`

### Verification Flow

1. Client requests authentication options from `/api/biometric/verify?type=FACE`
2. Server generates authentication options with:
   - `userVerification: 'required'`
   - `allowCredentials` for the specific type
3. Client gets credential using `navigator.credentials.get()`
4. Server verifies authentication response:
   - Validates signature using stored `publicKey`
   - **Checks `userVerified` flag** - if `false`, rejects with `PIN_NOT_ALLOWED`
   - Validates sign count to prevent replay attacks
   - Updates sign count on success

### PIN Rejection Logic

In `src/lib/webauthn.ts`, the `verifyAuthenticationResponse` function:

```typescript
const userVerified = verification.authenticationInfo?.userVerified ?? false;

if (!userVerified) {
  return {
    verified: false,
    error: 'PIN_NOT_ALLOWED',
    // ...
  };
}
```

This ensures that only authentications where user verification (biometric) was actually performed are accepted.

## Device Capability Detection

The system provides best-effort detection of device capabilities:

- **Windows**: Assumes both face and fingerprint are available if platform authenticator is available
- **iOS**: Assumes both are available (Face ID or Touch ID)
- **Android**: Assumes fingerprint is available, face is unknown

**Note**: True modality detection (face vs fingerprint) is not possible via WebAuthn API. The system provides best-effort heuristics and clearly labels them as such.

## Error Codes

- `PIN_NOT_ALLOWED`: Authentication used PIN instead of biometric
- `CHALLENGE_EXPIRED`: Challenge expired (5 minutes TTL)
- `NO_CREDENTIALS`: No credentials registered for the requested type
- `ALREADY_REGISTERED`: Credential already exists for this type
- `VERIFICATION_FAILED`: Signature verification failed
- `INVALID_SIGN_COUNT`: Sign count not increased (possible replay attack)

## Testing

### Manual Test Plan

1. **Windows with Face + Fingerprint**:
   - Register FACE credential
   - Register FINGERPRINT credential
   - Verify with both types
   - Attempt to use PIN → should be rejected

2. **Windows with only PIN**:
   - Attempt registration → should be blocked or rejected
   - Attempt verification → should show `PIN_NOT_ALLOWED` error

3. **iOS with Face ID**:
   - Register FACE credential
   - Verify with Face ID
   - Attempt to use passcode → should be rejected

4. **Android (fingerprint only)**:
   - Register FINGERPRINT credential
   - Verify with fingerprint
   - Attempt to register FACE → should show unavailable

### Development Logging

In development mode, the server logs:
- Challenge generation and verification
- User verification status
- Sign count updates
- Error details

Check console logs for:
```
[biometric/register] Generated attestation options for pensioner X, type FACE
[biometric/verify] Successfully verified FACE for pensioner X (userVerified: true)
```

## Security Considerations

1. **Challenge Storage**: Uses Redis in production for distributed systems, in-memory fallback for development
2. **Sign Count**: Prevents replay attacks by tracking and validating sign counts
3. **User Verification**: Enforces biometric-only by checking `userVerified` flag
4. **Origin Validation**: Validates request origin to prevent cross-origin attacks
5. **RP ID Validation**: Validates relying party ID matches configuration

## Troubleshooting

### "PIN_NOT_ALLOWED" Error

- **Cause**: User used PIN instead of biometric
- **Solution**: Ensure biometric is set up on device, guide user to use biometric

### "CHALLENGE_EXPIRED" Error

- **Cause**: Challenge expired (5 minutes TTL)
- **Solution**: Retry the operation

### "Platform Authenticator Not Available"

- **Cause**: Device doesn't support platform authenticators or not configured
- **Solution**: 
  - Windows: Configure Windows Hello in Settings
  - iOS: Ensure Face ID/Touch ID is set up
  - Android: Ensure fingerprint is set up

### Redis Connection Issues

- **Cause**: Redis not available or misconfigured
- **Solution**: System falls back to in-memory storage automatically (check logs for warning)

## Migration Notes

If you have existing credentials without `publicKey` or `signCount`:

1. These credentials will need to be re-registered
2. The system will flag them during verification
3. Users should delete old credentials and register new ones

## Future Enhancements

- [ ] Add unit tests for WebAuthn helpers
- [ ] Add integration tests for registration/verification flows
- [ ] Improve modality detection accuracy
- [ ] Add support for cross-device authentication
- [ ] Add credential backup/recovery mechanisms

