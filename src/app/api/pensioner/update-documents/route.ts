import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { uploadFile } from '@/lib/backblaze';

export const runtime = 'nodejs';

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const tokenPayload = bearer ? verifyToken(bearer) : null;

    const form = await request.formData();
    const id = form.get('id') as string;

    if (!id) return NextResponse.json({ message: 'Missing pensioner id' }, { status: 400 });
    if (tokenPayload && tokenPayload.id && Number(tokenPayload.id) !== Number(id)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const allowed = ['application/pdf', 'image/png', 'image/jpeg'];
    const maybeFiles = {
      idCard: form.get('idCard') as File | null,
      birthCert: form.get('birthCert') as File | null,
      appointment: form.get('appointment') as File | null,
      retirement: form.get('retirement') as File | null,
    };

    const uploadedFiles: any[] = [];

    const entries = Object.entries(maybeFiles) as [keyof typeof maybeFiles, File | null][];
    for (const [key, file] of entries) {
      if (file && allowed.includes(file.type)) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const fileName = `pensioners/${id}/${key}-${Date.now()}.${file.name.split('.').pop()}`;
          
          const uploadResult = await uploadFile(buffer, fileName, file.type);
          const fileUrl = `${process.env.S3_PUBLIC_BASE_URL || 'https://f003.backblazeb2.com/file/PensionerRegisgration'}/${fileName}`;
          
          const savedFile = await prisma.pensionerFile.create({
            data: {
              pensionerId: Number(id),
              fileType: key,
              fileUrl,
              originalName: file.name,
              publicId: uploadResult.fileId,
            },
          });
          
          uploadedFiles.push(savedFile);
        } catch (error) {
          console.error(`Failed to upload ${key}:`, error);
        }
      }
    }

    // Return the uploaded files information
    const documents = uploadedFiles.reduce((acc, file) => {
      acc[file.fileType] = file.fileUrl;
      return acc;
    }, {} as Record<string, string>);

    return NextResponse.json({ message: 'Documents updated', documents }, { status: 200 });
  } catch (err: any) {
    console.error('[update-documents] error', err);
    return NextResponse.json({ message: 'Failed to update documents' }, { status: 500 });
  }
}


