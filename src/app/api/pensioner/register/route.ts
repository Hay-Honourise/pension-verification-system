import { NextRequest, NextResponse } from 'next/server';
import { hash } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { copyFile, deleteFile, getPublicUrl } from '@/lib/backblaze';
import { calculatePension } from '@/lib/pension-calculator';
import { mailer } from '@/lib/email';

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
    const organizationStarted = formData.get('organizationStarted') as string;
    const organizationEnded = formData.get('organizationEnded') as string;
    const unitStarted = formData.get('unitStarted') as string;
    const unitEnded = formData.get('unitEnded') as string;
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
        !lastPromotionDate || !currentLevel || !salary || !password ||
        !organizationStarted || !organizationEnded || !unitStarted || !unitEnded) {
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

    // Calculate pension benefits
    console.log('Calculating pension benefits...');
    const pensionCalculation = calculatePension({
      salary: parseFloat(salary.replace(/[₦,]/g, '')) || 0,
      dateOfFirstAppointment: new Date(dateOfFirstAppointment),
      dateOfRetirement: new Date(dateOfRetirement),
      pensionSchemeType,
      currentLevel
    });
    
    console.log('Pension calculation result:', pensionCalculation);

    // Create pensioner record
    // Type assertion needed until TypeScript picks up the regenerated Prisma types
    const pensionerData: any = {
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
      organizationStarted: organizationStarted || null,
      organizationEnded: organizationEnded || null,
      unitStarted: unitStarted || null,
      unitEnded: unitEnded || null,
      password: hashedPassword,
      status: 'PENDING_VERIFICATION',
      
      // Calculated benefits (use calculated values instead of form data)
      yearsOfService: pensionCalculation.yearsOfService,
      totalGratuity: pensionCalculation.totalGratuity,
      monthlyPension: pensionCalculation.monthlyPension,
      gratuityRate: pensionCalculation.gratuityRate,
      pensionRate: pensionCalculation.pensionRate,
      
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const pensioner = await prisma.pensioner.create({
      data: pensionerData,
    });

    // Handle file uploads: files are already uploaded to B2 during Step 5
    const appointmentLetterData = formData.get('appointmentLetter') as string | null;
    const idCardData = formData.get('idCard') as string | null;
    const retirementLetterData = formData.get('retirementLetter') as string | null;
    const birthCertificateData = formData.get('birthCertificate') as string | null;
    const passportData = formData.get('passport') as string | null;

    const uploadedFiles: any[] = [];

    // Helper function to process file uploads
    const processFileUpload = async (
      fileDataString: string | null,
      fileTypePrefix: string,
      dbFileType: string
    ) => {
      if (!fileDataString) return;
      
      try {
        const fileInfo = JSON.parse(fileDataString);
        
        // Generate proper B2 public URL
        const fileUrl = await getPublicUrl(fileInfo.fileName);
        
        const savedFile = await prisma.pensionerfile.create({
          data: {
            id: `${fileTypePrefix}-${pensioner.id}-${Date.now()}`,
            pensionerId: pensioner.id,
            fileType: dbFileType,
            fileUrl: fileUrl,
            originalName: fileInfo.originalName,
            publicId: fileInfo.id, // Use the file ID from B2
          },
        });
        
        uploadedFiles.push(savedFile);
        console.log(`Successfully saved ${dbFileType} file:`, savedFile.id);
      } catch (e) {
        console.error(`Failed to process ${dbFileType}:`, e);
      }
    };

    // Process all file uploads
    await Promise.all([
      processFileUpload(appointmentLetterData, 'appointment', 'appointmentLetter'),
      processFileUpload(retirementLetterData, 'retirement', 'retirement'),
      processFileUpload(idCardData, 'idcard', 'idcard'),
      processFileUpload(birthCertificateData, 'birthcert', 'birthCertificate'),
      processFileUpload(passportData, 'passport', 'passport')
    ]);

    // Send registration confirmation email using Brevo
    console.log('📧 Attempting to send registration email...');
    console.log('📧 Email config check:', {
      hasHost: !!process.env.EMAIL_HOST,
      hasPort: !!process.env.EMAIL_PORT,
      hasUser: !!process.env.EMAIL_USER,
      hasPass: !!process.env.EMAIL_PASS ? '***' : false,
      fromEmail: process.env.EMAIL_FROM || `"Pension Verification System" <${process.env.EMAIL_USER}>`,
      toEmail: pensioner.email,
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
    });

    try {
      const emailResult = await mailer.sendMail({
        from: process.env.EMAIL_FROM || `"Pension Verification System" <${process.env.EMAIL_USER}>`,
        to: pensioner.email,
        subject: 'Registration Complete - Pension Verification System',
        html: `
          <div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Registration Successful</h1>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
              <h2 style="margin: 0 0 15px 0; color: #333;">Hello ${pensioner.fullName},</h2>
              
              <p style="margin: 0 0 15px 0; line-height: 1.6;">
                Your pension verification registration was completed successfully.
              </p>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Your Registration Details:</strong></p>
                <p style="margin: 5px 0;"><strong>Pension ID:</strong> ${pensioner.pensionId}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${pensioner.email}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> ${pensioner.status}</p>
              </div>
              
              <p style="margin: 20px 0 15px 0; line-height: 1.6;">
                You can now log in to your account and continue your verification process.
              </p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_ORIGIN || 'http://localhost:3000'}/pensioner/login" 
                   style="display: inline-block; background: #667eea; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                  Login to Your Account
                </a>
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                <p style="margin: 0 0 10px 0; font-size: 12px; color: #666;">
                  <strong>Important:</strong> If you did not initiate this registration, please contact support immediately.
                </p>
                <p style="margin: 0; font-size: 12px; color: #999;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
            <div style="background: #f9f9f9; padding: 20px; text-align: center; border: 1px solid #e0e0e0; border-top: none;">
              <p style="margin: 0; font-size: 12px; color: #666;">
                <strong>Pension Verification System</strong><br/>
                Oyo State Government
              </p>
              <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">
                Regards,<br>Pension Verification Team
              </p>
            </div>
          </div>
        `,
      });
      
      console.log('✅ Email sent successfully!');
      console.log('📧 Email details:', {
        messageId: emailResult.messageId,
        accepted: emailResult.accepted,
        rejected: emailResult.rejected,
        response: emailResult.response,
        to: pensioner.email,
      });
    } catch (emailError: any) {
      console.error('❌ Email sending failed!');
      console.error('📧 Email error details:', {
        message: emailError?.message,
        code: emailError?.code,
        command: emailError?.command,
        response: emailError?.response,
        responseCode: emailError?.responseCode,
        stack: emailError?.stack,
        to: pensioner.email,
      });
      
      // Log specific Brevo error codes
      if (emailError?.code === 'EAUTH' || emailError?.responseCode === 535) {
        console.error('❌ AUTHENTICATION FAILED (535) - This means your EMAIL_PASS is incorrect!');
        console.error('📧 SOLUTION:');
        console.error('   1. Go to Brevo Dashboard → Settings → SMTP & API → SMTP');
        console.error('   2. Copy your SMTP Key (NOT your login password!)');
        console.error('   3. Update EMAIL_PASS in .env.local with the SMTP key');
        console.error('   4. Make sure EMAIL_USER matches your verified Brevo email');
        console.error('   5. Restart your dev server');
        console.error('📧 Current EMAIL_USER:', process.env.EMAIL_USER);
        console.error('📧 Make sure EMAIL_PASS is the SMTP key from Brevo (starts with "xsmtp-" or long random string)');
      } else if (emailError?.code === 'ECONNECTION') {
        console.error('❌ Connection failed! Check your EMAIL_HOST and EMAIL_PORT in .env.local');
      } else if (emailError?.responseCode === 550) {
        console.error('❌ Email rejected by server! Check if the sender email is verified in Brevo');
      }
      
      console.warn(`⚠️ Registration completed for ${pensioner.email}, but email notification failed to send.`);
      // Registration still succeeds even if email fails
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
