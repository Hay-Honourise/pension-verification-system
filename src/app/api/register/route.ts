import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract form data
    const pensionId = formData.get('pensionId') as string;
    const fullName = formData.get('fullName') as string;
    const nin = formData.get('nin') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const gender = formData.get('gender') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const residentialAddress = formData.get('residentialAddress') as string;
    const pensionSchemeType = formData.get('pensionSchemeType') as string;
    const dateOfFirstAppointment = formData.get('dateOfFirstAppointment') as string;
    const dateOfRetirement = formData.get('dateOfRetirement') as string;
    const pfNumber = formData.get('pfNumber') as string;
    const lastPromotionDate = formData.get('lastPromotionDate') as string;
    const currentLevel = formData.get('currentLevel') as string;
    const salary = formData.get('salary') as string;
    const expectedRetirementDate = formData.get('expectedRetirementDate') as string;
    const maidenName = formData.get('maidenName') as string;
    const password = formData.get('password') as string;
    
    // Extract calculated benefits
    const yearsOfService = formData.get('yearsOfService') as string;
    const totalGratuity = formData.get('totalGratuity') as string;
    const monthlyPension = formData.get('monthlyPension') as string;
    const gratuityRate = formData.get('gratuityRate') as string;
    const pensionRate = formData.get('pensionRate') as string;
    
    // Validate required fields
    if (!pensionId || !fullName || !nin || !dateOfBirth || !gender || 
        !email || !phone || !residentialAddress || !pensionSchemeType || 
        !dateOfFirstAppointment || !dateOfRetirement || !pfNumber || 
        !lastPromotionDate || !currentLevel || !salary || !expectedRetirementDate || !password) {
      return NextResponse.json(
        { message: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Check if pensioner already exists
    const existingPensioner = await prisma.pensioner.findFirst({
      where: {
        OR: [
          { pensionId },
          { nin },
          { email },
          { pfNumber }
        ]
      }
    });

    if (existingPensioner) {
      return NextResponse.json(
        { message: 'A pensioner with this Pension ID, NIN, Email, or PF Number already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 12);

    // Create pensioner record
    const pensioner = await prisma.pensioner.create({
      data: {
        pensionId,
        fullName,
        nin,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        email,
        phone,
        residentialAddress,
        pensionSchemeType,
        dateOfFirstAppointment: new Date(dateOfFirstAppointment),
        dateOfRetirement: new Date(dateOfRetirement),
        pfNumber,
        lastPromotionDate: new Date(lastPromotionDate),
        currentLevel,
        salary: parseFloat(salary.replace(/[₦,]/g, '')) || 0,
        expectedRetirementDate: new Date(expectedRetirementDate),
        maidenName: maidenName || null,
        password: hashedPassword,
        status: 'PENDING_VERIFICATION',
        
        // Calculated benefits
        yearsOfService: yearsOfService ? parseInt(yearsOfService) : null,
        totalGratuity: totalGratuity ? parseFloat(totalGratuity) : null,
        monthlyPension: monthlyPension ? parseFloat(monthlyPension) : null,
        gratuityRate: gratuityRate ? parseFloat(gratuityRate) : null,
        pensionRate: pensionRate ? parseFloat(pensionRate) : null,
        
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Handle file uploads: save only the file path/URL, not raw image
    const passportPhoto = formData.get('passportPhoto') as File | null;

    if (passportPhoto && typeof passportPhoto.arrayBuffer === 'function') {
      try {
        const uploadBase = path.join(process.cwd(), 'public', 'uploads', 'pensioners', pensioner.id);
        await fs.mkdir(uploadBase, { recursive: true });

        const originalName = passportPhoto.name || 'photo';
        const ext = path.extname(originalName) || '.jpg';
        const fileName = `photo-${Date.now()}${ext}`;
        const filePath = path.join(uploadBase, fileName);

        const buffer = Buffer.from(await passportPhoto.arrayBuffer());
        await fs.writeFile(filePath, buffer);

        const relativeUrl = `/uploads/pensioners/${pensioner.id}/${fileName}`;
        await prisma.pensioner.update({
          where: { id: pensioner.id },
          data: { photo: relativeUrl } as any,
        });
      } catch (e) {
        console.error('Failed to save passport photo:', e);
      }
    }

    // Return success response
    return NextResponse.json({
      message: 'Registration successful',
      pensionerId: pensioner.id,
      status: 'PENDING_VERIFICATION'
    }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        message: 'Internal server error during registration',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
