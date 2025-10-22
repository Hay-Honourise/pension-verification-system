import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { pensionId, password } = await request.json();

    if (!pensionId || !password) {
      return NextResponse.json(
        { message: 'Pension ID and password are required' },
        { status: 400 }
      );
    }

    // Find pensioner by pensionId
    const pensioner = await prisma.pensioner.findUnique({
      where: { pensionId }
    });

    if (!pensioner) {
      return NextResponse.json(
        { message: 'Invalid Pension ID or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, pensioner.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { message: 'Invalid Pension ID or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      id: pensioner.id,
      role: 'pensioner',
      email: pensioner.email,
      pensionId: pensioner.pensionId,
    });

    // Return success response with token
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: pensioner.id,
        pensionId: pensioner.pensionId,
        fullName: pensioner.fullName,
        photo: pensioner.photo,
        email: pensioner.email,
        status: pensioner.status,
        role: 'pensioner',
        // Include calculated benefits
        yearsOfService: pensioner.yearsOfService,
        totalGratuity: pensioner.totalGratuity,
        monthlyPension: pensioner.monthlyPension,
        gratuityRate: pensioner.gratuityRate,
        pensionRate: pensioner.pensionRate,
        salary: pensioner.salary,
        pensionSchemeType: pensioner.pensionSchemeType,
        currentLevel: pensioner.currentLevel,
        dateOfFirstAppointment: pensioner.dateOfFirstAppointment
      }
    });

  } catch (error) {
    console.error('Pensioner login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
