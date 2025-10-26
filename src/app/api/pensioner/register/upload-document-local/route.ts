import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/pdf'
]);

// Local file storage directory
const UPLOAD_DIR = join(process.cwd(), 'uploads', 'pensioner-documents');

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const fileType = (form.get('fileType') as string) || 'unknown';
    const pensionId = form.get('pensionId') as string | null;

    if (!file) {
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    if (!pensionId) {
      return NextResponse.json({ message: 'Pension ID is required' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ 
        message: 'Invalid file type. Only JPG, PNG, GIF, and PDF files are allowed.' 
      }, { status: 415 });
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ 
        message: 'File too large. Maximum size is 10MB.' 
      }, { status: 413 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('File upload details:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      pensionId: pensionId,
      bufferSize: buffer.length
    });

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
      console.log('Created upload directory:', UPLOAD_DIR);
    }

    // Generate unique filename with timestamp and pension ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `${timestamp}-${pensionId}-${fileType}.${fileExtension}`;
    const filePath = join(UPLOAD_DIR, fileName);

    console.log('Saving file locally:', filePath);

    // Save file locally
    await writeFile(filePath, buffer);

    // Generate file URL (for local development)
    const fileUrl = `/uploads/pensioner-documents/${fileName}`;

    console.log('File saved successfully:', {
      fileName: fileName,
      filePath: filePath,
      fileUrl: fileUrl,
      size: buffer.length
    });

    // Return the file information for storage in sessionStorage
    return NextResponse.json({
      success: true,
      file: {
        id: `local-${timestamp}`,
        fileName: fileName,
        originalName: file.name,
        fileType: fileType,
        contentType: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        url: fileUrl,
        localPath: filePath
      }
    });

  } catch (error: any) {
    console.error('[register/upload-document] error:', error);
    console.error('[register/upload-document] error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({ 
      message: 'Upload failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
}
