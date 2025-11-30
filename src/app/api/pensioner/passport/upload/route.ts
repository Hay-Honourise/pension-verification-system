import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/aws-config';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!bearer) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = verifyToken(bearer);
    if (!token?.id || token.role !== 'pensioner') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pensionerId = Number(token.id);
    if (Number.isNaN(pensionerId)) {
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Get pensioner
    const pensioner = await prisma.pensioner.findUnique({
      where: { id: pensionerId },
    });

    if (!pensioner) {
      return NextResponse.json({ message: 'Pensioner not found' }, { status: 404 });
    }

    // Parse request body
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: 'File must be an image' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique file name
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `passport-${pensionerId}-${Date.now()}.${fileExtension}`;
    const key = `passports/${fileName}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        pensionerId: String(pensionerId),
        uploadedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    // Generate S3 URL
    const region = process.env.AWS_REGION || 'us-east-1';
    // S3 URLs use the key as-is (slashes are part of the path)
    const passportUrl = `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${key}`;

    // Update pensioner record
    // Type assertion needed because Prisma client hasn't been regenerated
    await (prisma.pensioner.update as any)({
      where: { id: pensionerId },
      data: {
        passportUploaded: true,
        passportUrl: passportUrl,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Passport uploaded successfully',
      passportUrl: passportUrl,
    });
  } catch (error: any) {
    console.error('Passport upload error:', error);
    return NextResponse.json(
      {
        message: 'Failed to upload passport',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

