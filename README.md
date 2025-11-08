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
- `POST /api/biometric/register` - Register biometric credential
- `GET /api/biometric/verify?type={FACE|FINGERPRINT}` - Get verification challenge
- `POST /api/biometric/verify` - Verify biometric credential
- `GET /api/biometric/credentials` - List registered credentials
- Additional endpoints for CRUD operations will be implemented

## Biometric Verification Testing

### Prerequisites

1. **Windows 10/11** with Windows Hello enabled
2. **Compatible hardware**:
   - For Face: Camera with Windows Hello Face support
   - For Fingerprint: Fingerprint reader with Windows Hello support
3. **Modern browser**: Chrome, Edge, or Firefox with WebAuthn support
4. **Windows Hello setup**: Both Face and Fingerprint should be configured in Windows Settings

### Manual Test Steps

#### 1. Test Face Registration

1. Log in as a pensioner
2. Navigate to `/pensioner/verification`
3. Click "Register Face" button
4. Windows Hello should prompt for face authentication
5. Complete the face scan
6. **Expected Result**: 
   - Success message: "FACE registration successful!"
   - Credential saved in database with `type='FACE'`
   - CredentialId stored as base64url string
   - Debug panel (if enabled) shows the credential

#### 2. Test Fingerprint Registration

1. On the same page, click "Register Fingerprint" button
2. Windows Hello should prompt for fingerprint authentication
3. Complete the fingerprint scan
4. **Expected Result**:
   - Success message: "FINGERPRINT registration successful!"
   - Separate credential saved with `type='FINGERPRINT'`
   - Different credentialId from the Face credential
   - Both credentials visible in debug panel

#### 3. Test Face Verification

1. Click "Verify using Face" button
2. **Expected Behavior**:
   - Server returns challenge with `allowCredentials` containing ONLY Face credentialId(s)
   - Windows Hello should prompt for face authentication
   - If fingerprint prompt appears instead, this is normal Windows Hello behavior (OS-controlled)
3. Complete the authentication
4. **Expected Result**:
   - Success message: "FACE verification successful!"
   - Verification log created with `method='WINDOWS_HELLO_FACE'`

#### 4. Test Fingerprint Verification

1. Click "Verify using Fingerprint" button
2. **Expected Behavior**:
   - Server returns challenge with `allowCredentials` containing ONLY Fingerprint credentialId(s)
   - Windows Hello should prompt for fingerprint authentication
3. Complete the authentication
4. **Expected Result**:
   - Success message: "FINGERPRINT verification successful!"
   - Verification log created with `method='WINDOWS_HELLO_FINGERPRINT'`

### Verification Checklist

- [ ] Face registration creates separate credential with `type='FACE'`
- [ ] Fingerprint registration creates separate credential with `type='FINGERPRINT'`
- [ ] Face verification uses only Face credentialId(s) in `allowCredentials`
- [ ] Fingerprint verification uses only Fingerprint credentialId(s) in `allowCredentials`
- [ ] CredentialIds are properly encoded/decoded (base64url format)
- [ ] Challenges are stored per type (userId_type key)
- [ ] Error messages are clear and helpful
- [ ] Debug panel shows correct credential information

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

1. **Windows Hello Modality Selection**: Windows Hello may show fingerprint prompt even when registering Face (or vice versa). This is OS-controlled behavior. The system correctly stores separate credentials for each type.

2. **CredentialId Encoding**: CredentialIds are stored as base64url strings and must be properly decoded on the client side before use in WebAuthn API.

3. **Challenge Storage**: Challenges are stored in-memory keyed by `userId_type`. In production, consider using Redis for distributed systems.

4. **Type Separation**: The system uses different user IDs (`userId_type`) during registration to help Windows Hello create separate credentials, though the OS may still choose the modality.

5. **Error Handling**: All errors include error codes for programmatic handling:
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
