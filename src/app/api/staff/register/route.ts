import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcrypt';

// Matches enum in schema.prisma
enum Role {
  ADMIN = 'ADMIN',
  VERIFICATION_OFFICER = 'VERIFICATION_OFFICER',
}

export async function POST(req: NextRequest) {
  try {
    let payload: any;
    try {
      payload = await req.json();
    } catch (e: any) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body', errorDetails: process.env.NODE_ENV !== 'production' ? e?.message : undefined },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      phone,
      staffId,
      department,
      role,
    } = payload;

    // Validation
    if (!fullName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const normalizedRole = role.toUpperCase().replace(/\s+/g, '_') as Role;
    if (!Object.values(Role).includes(normalizedRole)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Check uniqueness
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 }
      );
    }

    if (staffId) {
      const existingByStaffId = await prisma.user.findFirst({
        where: { staffId },
      });
      if (existingByStaffId) {
        return NextResponse.json(
          { success: false, error: 'Staff ID already in use' },
          { status: 409 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const staff = await prisma.user.create({
      data: {
        fullName,
        email,
        password: hashedPassword,
        phone: phone || null,
        staffId: staffId || null,
        department: department || null,
        role: normalizedRole,
      },
    });

    // Redirect depending on role
    const redirectTo =
      staff.role === Role.ADMIN ? '/admin/login' : '/officer/login';

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      redirectTo,
    });
  } catch (err: any) {
    console.error('Staff register error:', err);

    // Prisma known request errors (e.g., unique constraints)
    if (err?.code === 'P2002') {
      const target = Array.isArray(err?.meta?.target)
        ? err.meta.target.join(', ')
        : err?.meta?.target || 'field';
      const msg = target.includes('email')
        ? 'Email already in use'
        : target.includes('staffId')
        ? 'Staff ID already in use'
        : 'Duplicate value';
      return NextResponse.json({ success: false, error: msg }, { status: 409 });
    }

    // Other Prisma validation/data errors
    const prismaKnownValidationCodes = new Set(['P2000', 'P2009', 'P2010', 'P2012', 'P2011']);
    if (err?.code && prismaKnownValidationCodes.has(err.code)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid data provided',
          errorDetails: process.env.NODE_ENV !== 'production' ? { code: err.code, message: err.message, meta: err.meta } : undefined,
        },
        { status: 400 }
      );
    }

    // Fallback unexpected error
    return NextResponse.json(
      {
        success: false,
        error: 'Registration failed',
        errorDetails: process.env.NODE_ENV !== 'production' ? { message: err?.message, code: err?.code } : undefined,
      },
      { status: 500 }
    );
  }
}
