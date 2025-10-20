import { NextRequest, NextResponse } from 'next/server';
import { uploadFile } from '@/lib/backblaze';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/pdf'
]);

export async function POST(request: NextRequest) {
  try {
    // Check if Backblaze B2 S3 environment variables are configured
    const requiredEnvVars = ['S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY', 'S3_BUCKET'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('Missing Backblaze B2 S3 environment variables:', missingVars);
      return NextResponse.json({ 
        message: 'Backblaze B2 S3 configuration is missing. Please check environment variables.' 
      }, { status: 500 });
    }

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

    // Generate unique filename with timestamp and pension ID
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || '';
    const fileName = `temp-registration/${timestamp}-${pensionId}/${fileType}-${timestamp}.${fileExtension}`;

    console.log('Generated filename:', fileName);

    // Upload to Backblaze B2
    const uploadResult = await uploadFile(buffer, fileName, file.type);

    // Return the file information for storage in sessionStorage
    return NextResponse.json({
      success: true,
      file: {
        id: uploadResult.fileId,
        fileName: uploadResult.fileName,
        originalName: file.name,
        fileType: fileType,
        contentType: uploadResult.contentType,
        size: file.size,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('[register/upload-document] error:', error);
    console.error('[register/upload-document] error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed. Please try again.';
    
    if (error.message?.includes('S3_BUCKET is not configured')) {
      errorMessage = 'Backblaze B2 bucket configuration is missing.';
    } else if (error.message?.includes('Failed to authenticate')) {
      errorMessage = 'Backblaze B2 authentication failed. Please check your credentials.';
    } else if (error.message?.includes('Failed to get upload URL')) {
      errorMessage = 'Failed to get upload URL from Backblaze B2.';
    } else if (error.message?.includes('Failed to upload file')) {
      errorMessage = 'File upload to Backblaze B2 failed.';
    } else if (error.message?.includes('Authentication error')) {
      errorMessage = 'Backblaze B2 authentication error. Please check your credentials.';
    } else if (error.message?.includes('Access denied')) {
      errorMessage = 'Backblaze B2 access denied. Please check your permissions.';
    } else if (error.message?.includes('Bad request')) {
      errorMessage = `Backblaze B2 bad request: ${error.message}`;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }
}
