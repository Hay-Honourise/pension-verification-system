import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { copyFile, deleteFile } from '@/lib/backblaze';

export async function POST(request: NextRequest) {
  try {
    console.log('Registration API called');
    const formData = await request.formData();
    console.log('Form data received');
    
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
        !lastPromotionDate || !currentLevel || !salary || !password) {
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

    // Handle file uploads: move files from temp to permanent location in B2
    const appointmentLetterData = formData.get('appointmentLetter') as string | null;
    const idCardData = formData.get('idCard') as string | null;
    const retirementLetterData = formData.get('retirementLetter') as string | null;
    const birthCertificateData = formData.get('birthCertificate') as string | null;

    const uploadedFiles: any[] = [];

    // Process appointment letter
    if (appointmentLetterData) {
      try {
        const fileInfo = JSON.parse(appointmentLetterData);
        const permanentFileName = `pensioners/${pensioner.id}/appointment-${Date.now()}.${fileInfo.originalName.split('.').pop()}`;
        
        const copyResult = await copyFile(fileInfo.id, permanentFileName);
        
        // Store in database
          const savedFile = await prisma.pensionerfile.create({
            data: {
              id: `appointment-${pensioner.id}-${Date.now()}`,
              pensionerId: pensioner.id,
              fileType: 'appointmentLetter',
              fileUrl: `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${permanentFileName}`,
              originalName: fileInfo.originalName,
              publicId: copyResult.fileId || '',
            },
          });
        
        uploadedFiles.push(savedFile);
        
        // Delete temp file
        await deleteFile(fileInfo.id, fileInfo.fileName);
      } catch (e) {
        console.error('Failed to process appointment letter:', e);
      }
    }

    // Process retirement letter
    if (retirementLetterData) {
      try {
        const fileInfo = JSON.parse(retirementLetterData);
        const permanentFileName = `pensioners/${pensioner.id}/retirement-${Date.now()}.${fileInfo.originalName.split('.').pop()}`;
        
        const copyResult = await copyFile(fileInfo.id, permanentFileName);
        
        const savedFile = await prisma.pensionerfile.create({
          data: {
            id: `retirement-${pensioner.id}-${Date.now()}`,
            pensionerId: pensioner.id,
            fileType: 'retirement',
            fileUrl: `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${permanentFileName}`,
            originalName: fileInfo.originalName,
            publicId: copyResult.fileId || '',
          },
        });
        
        uploadedFiles.push(savedFile);
        await deleteFile(fileInfo.id, fileInfo.fileName);
      } catch (e) {
        console.error('Failed to process retirement letter:', e);
      }
    }

    // Process ID card
    if (idCardData) {
      try {
        const fileInfo = JSON.parse(idCardData);
        const permanentFileName = `pensioners/${pensioner.id}/idcard-${Date.now()}.${fileInfo.originalName.split('.').pop()}`;
        
        const copyResult = await copyFile(fileInfo.id, permanentFileName);
        
        const savedFile = await prisma.pensionerfile.create({
          data: {
            id: `idcard-${pensioner.id}-${Date.now()}`,
            pensionerId: pensioner.id,
            fileType: 'idcard',
            fileUrl: `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${permanentFileName}`,
            originalName: fileInfo.originalName,
            publicId: copyResult.fileId || '',
          },
        });
        
        uploadedFiles.push(savedFile);
        await deleteFile(fileInfo.id, fileInfo.fileName);
      } catch (e) {
        console.error('Failed to process ID card:', e);
      }
    }

    // Process birth certificate
    if (birthCertificateData) {
      try {
        const fileInfo = JSON.parse(birthCertificateData);
        const permanentFileName = `pensioners/${pensioner.id}/birth-cert-${Date.now()}.${fileInfo.originalName.split('.').pop()}`;
        
        const copyResult = await copyFile(fileInfo.id, permanentFileName);
        
        const savedFile = await prisma.pensionerfile.create({
          data: {
            id: `birthcert-${pensioner.id}-${Date.now()}`,
            pensionerId: pensioner.id,
            fileType: 'birthCertificate',
            fileUrl: `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${permanentFileName}`,
            originalName: fileInfo.originalName,
            publicId: copyResult.fileId || '',
          },
        });
        
        uploadedFiles.push(savedFile);
        await deleteFile(fileInfo.id, fileInfo.fileName);
      } catch (e) {
        console.error('Failed to process birth certificate:', e);
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
