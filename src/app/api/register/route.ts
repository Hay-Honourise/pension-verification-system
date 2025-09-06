import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';

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

    // Handle file uploads (for now, just log them - you can implement file storage later)
    const passportPhoto = formData.get('passportPhoto') as File;
    const retirementLetter = formData.get('retirementLetter') as File;
    const idCard = formData.get('idCard') as File;

    if (passportPhoto || retirementLetter || idCard) {
      // Log file information (implement actual file storage as needed)
      console.log('Files received:', {
        passportPhoto: passportPhoto?.name,
        retirementLetter: retirementLetter?.name,
        idCard: idCard?.name
      });
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
