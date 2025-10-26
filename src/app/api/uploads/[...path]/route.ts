import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'pensioner-documents');

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const fileName = params.path.join('/');
    const filePath = join(UPLOAD_DIR, fileName);

    // Security check - ensure file is within upload directory
    if (!filePath.startsWith(UPLOAD_DIR)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return NextResponse.json({ message: 'File not found' }, { status: 404 });
    }

    // Read file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const extension = fileName.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';

    switch (extension) {
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        break;
    }

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });

  } catch (error: any) {
    console.error('[uploads] error:', error);
    return NextResponse.json({ 
      message: 'Error serving file',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}
