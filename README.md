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
- Additional endpoints for CRUD operations will be implemented

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
