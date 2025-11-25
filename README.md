# Oyo State Pension Verification System

A comprehensive web application for managing pension verification processes for retired public servants in Oyo State, Nigeria.

## Features

- **Landing Page**: Welcome message, address, and social media links
- **Admin Login**: Secure authentication with email and password
- **Admin Dashboard**: Comprehensive management interface with:
  - Dashboard overview with statistics
  - Pensioners management
  - Verification queue
  - Document management
  - Reports and analytics
  - System settings

## Tech Stack

- **Frontend & Backend**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt for password hashing
- **Deployment**: Ready for Vercel or any Node.js hosting

## Color Scheme

- **Green (#16a34a)**: Primary background color
- **White (#ffffff)**: Text color
- **Orange (#f97316)**: Hover effects and accents

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/              # API routes
│   ├── admin-dashboard/  # Admin dashboard page
│   ├── admin-login/      # Admin login page
│   └── page.tsx          # Home/landing page
├── components/            # Reusable components
├── lib/                   # Utility functions
├── types/                 # TypeScript type definitions
└── assets/                # Images and static files
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- MySQL database
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pension-verification-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="mysql://username:password@localhost:3306/pension_verification"
JWT_SECRET="your-super-secret-jwt-key-here"
```

4. Set up the database:
```bash
npx prisma db push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Setup

The system uses the following main entities:

- **Admin**: System administrators with login credentials
- **Pensioner**: Retired public servants with verification status
- **Document**: Uploaded documents for verification

## API Endpoints

- `POST /api/auth/login` - Admin authentication
- `GET /api/biometric/register?type={FACE|FINGERPRINT}` - Get registration challenge
- `POST /api/biometric/register/verify` - Persist signed attestation (passkey)
- `GET /api/biometric/verify?type={FACE|FINGERPRINT}` - Issue verification challenge (discoverable credential)
- `POST /api/biometric/verify` - Verify passkey assertion + update verification logs
- `GET /api/biometric/credentials` - List registered credentials
- Additional endpoints for CRUD operations will be implemented

## Passkey / WebAuthn Setup

### Required environment variables

Add the following to `.env.local` (or hosting provider secrets):

```
RP_NAME="Oyo Pension Verification"
RP_ID="pension-verification-system.vercel.app"
ORIGIN="https://pension-verification-system.vercel.app"
```

For local development use:

```
RP_ID=localhost
ORIGIN=http://localhost:3000
```

`RP_ID` **must** match the hostname used by the browser (no protocol/port). Browsers only allow passkeys on HTTPS (or `http://localhost`).

### Challenge storage

`src/lib/webauthn-challenge-store.ts` writes challenges through `lib/challenges`. If `REDIS_URL` is set the store uses Redis; otherwise it falls back to an in-memory `Map` (not suitable for multi-instance deployments). Configure a managed Redis instance before going to production.

### Manual test plan

1. **Register (face)**  
   - Visit `/pensioner/biometric/register` and choose *Face*.  
   - Confirm a Windows Hello / Face ID prompt appears and the request completes successfully.
2. **Register (fingerprint)**  
   - On the same page choose *Fingerprint*.  
   - Ensure a separate credential is stored in `biometriccredential` with `type='FINGERPRINT'`.
3. **Verify on same device**  
   - Go to `/pensioner/biometric/verify` and run both Face and Fingerprint flows.  
   - Expect success toast and `verificationlog` entry with `method='WINDOWS_HELLO_<TYPE>'`.
4. **Cross-device check**  
   - Register on desktop, verify on Android/iOS (Chrome/Safari) with the same Google/iCloud account to confirm passkey sync.  
   - Repeat in reverse (mobile → desktop).
5. **Error scenarios**  
   - Try verifying without a credential → API responds `NO_CREDENTIALS`.  
   - Wait >5 minutes between challenge + response → API returns `CHALLENGE_EXPIRED`.  
   - Attempt with deleted credential → API returns `CREDENTIAL_NOT_FOUND`.

### Verification checklist

- [ ] Resident key is required (`residentKey='required'`, `requireResidentKey=true`).
- [ ] `userVerification='required'` is enforced on both registration and verification.
- [ ] `allowCredentials` is empty during verification to allow discoverable passkeys.
- [ ] Credential public keys & IDs are stored as base64url strings.
- [ ] Sign counters increment after each verification.
- [ ] Redis (or fallback) removes challenges after successful verification.
- [ ] UI clearly explains “No passkeys on this device” and links to the registration page.

### Troubleshooting

#### Issue: "Face registration shows fingerprint prompt"

**Explanation**: Windows Hello chooses the biometric modality based on device settings and availability. This is normal OS behavior.

**Solution**: 
- Ensure Face is set up in Windows Settings → Accounts → Sign-in options → Windows Hello Face
- The system stores separate credentials for each type, so both can coexist
- Try registering on a device with both modalities configured

#### Issue: "Credential not found for type"

**Possible Causes**:
- Wrong credential type being used
- CredentialId mismatch
- Database query filtering by type incorrectly

**Solution**:
- Check debug panel to see registered credentials
- Verify credentialId encoding matches between registration and verification
- Check server logs for credential lookup details

#### Issue: "Challenge expired" or "Challenge not found"

**Possible Causes**:
- Challenge expired (5-minute timeout)
- Challenge not stored correctly per type
- Multiple requests overwriting challenge

**Solution**:
- Try the operation again (new challenge will be generated)
- Check server logs for challenge storage/retrieval
- Verify challenge key format: `userId_type`

### Debug Panel

The debug panel (accessible via "Debug Info" button) shows:
- WebAuthn support status
- Windows Hello availability
- Registered credentials with:
  - Type (FACE/FINGERPRINT)
  - CredentialId (full in dev mode, preview in production)
  - Registration timestamp

### Server-Side Testing

To verify `allowCredentials` logic programmatically:

```typescript
// Mock test
const credentials = await prisma.biometriccredential.findMany({
  where: {
    pensionerId: testPensionerId,
    type: 'FACE' // Should only return FACE credentials
  }
});

// Verify only FACE credentials are returned
expect(credentials.every(c => c.type === 'FACE')).toBe(true);

// Verify allowCredentials contains only FACE credentialIds
const allowCredentials = credentials.map(c => c.credentialId);
// Use in WebAuthn challenge generation
```

### Important Notes

1. **OS chooses the modality** – Windows Hello / Android hardware may still prompt for fingerprint when you intend to use Face (and vice versa). This is normal; the server only requires `userVerification` and then labels the credential based on the selected card.
2. **Credential encoding** – Credential IDs and public keys are persisted as base64url strings. Convert with `Buffer.from(value, 'base64url')` on the server or helper utilities on the client.
3. **Challenge storage** – `src/lib/webauthn-challenge-store.ts` delegates to Redis when `REDIS_URL` is configured; otherwise an in-memory fallback is used (single-instance only).
4. **Discoverable verification** – Authentication options intentionally omit `allowCredentials` so passkeys that sync via Google Password Manager / iCloud Keychain can be used on any device.
5. **Error Handling** – Biometric endpoints return structured codes for client handling:
   - `ALREADY_REGISTERED`: Credential already exists for this type
   - `NO_CREDENTIALS`: No credentials found for the requested type
   - `CREDENTIAL_NOT_FOUND`: CredentialId doesn't match stored credential
   - `CHALLENGE_EXPIRED`: Challenge expired (5-minute timeout)
   - `INVALID_TYPE`: Invalid biometric type (must be FACE or FINGERPRINT)

## Development

### Adding New Features

1. Create new pages in `src/app/`
2. Add components in `src/components/`
3. Update types in `src/types/`
4. Add API routes in `src/app/api/`

### Database Migrations

```bash
npx prisma migrate dev --name <migration-name>
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is developed for Oyo State Pensions Board.

## Support

For support and questions, please contact the development team.
