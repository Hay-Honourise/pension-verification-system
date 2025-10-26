import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, role } = body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return NextResponse.json({ 
        message: 'All fields are required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        message: 'Invalid email format' 
      }, { status: 400 });
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ 
        message: 'Password must be at least 6 characters' 
      }, { status: 400 });
    }

    // Validate role
    if (!['admin', 'verification_officer'].includes(role)) {
      return NextResponse.json({ 
        message: 'Invalid role specified' 
      }, { status: 400 });
    }

    // Check if admin with this email already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return NextResponse.json({ 
        message: 'Admin with this email already exists' 
      }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        id: randomUUID(),
        name,
        email,
        password: hashedPassword,
        role,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    console.log('Admin created successfully:', admin.email);

    return NextResponse.json({ 
      success: true,
      message: 'Admin account created successfully',
      admin
    });

  } catch (err) {
    console.error('[admin/register] error', err);
    return NextResponse.json({ 
      message: 'Server error',
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}
