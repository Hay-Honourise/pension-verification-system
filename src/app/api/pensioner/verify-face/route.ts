import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, CompareFacesCommand } from '@aws-sdk/client-rekognition';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { rekognitionClient, s3Client, S3_BUCKET } from '@/lib/aws-config';
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

    // Type assertion for passport fields (Prisma client needs regeneration)
    // These fields exist in the database but TypeScript doesn't know about them yet
    const passportUploaded = (pensioner as any).passportUploaded as boolean | null | undefined;
    const passportUrl = (pensioner as any).passportUrl as string | null | undefined;

    // Check if passport is uploaded
    if (!passportUploaded || !passportUrl) {
      return NextResponse.json(
        { message: 'Please upload your passport first' },
        { status: 400 }
      );
    }

    // Parse request body
    const { liveImage } = await request.json();

    if (!liveImage) {
      return NextResponse.json({ message: 'Live image is required' }, { status: 400 });
    }

    // Get passport image from S3
    // At this point, passportUrl is guaranteed to be a string (not null/undefined)
    const passportUrlString: string = passportUrl;
    let passportImageBuffer: Buffer;
    try {
      // Extract the S3 key from the URL
      // URL format: https://bucket.s3.region.amazonaws.com/path/to/file
      let s3Key: string;
      
      if (passportUrlString.startsWith('http')) {
        try {
          // Extract key from URL
          const url = new URL(passportUrlString);
          // Remove leading slash from pathname
          s3Key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
          
          // Handle URL-encoded characters
          s3Key = decodeURIComponent(s3Key);
        } catch (urlError) {
          console.error('Error parsing passport URL:', urlError);
          // If URL parsing fails, try to extract key manually
          const match = passportUrlString.match(/\.amazonaws\.com\/(.+)$/);
          if (match) {
            s3Key = decodeURIComponent(match[1]);
          } else {
            throw new Error('Unable to extract S3 key from URL');
          }
        }
      } else {
        // If it's already a key, use it directly
        s3Key = passportUrlString;
      }

      console.log('Fetching passport image from S3:', { 
        bucket: S3_BUCKET, 
        key: s3Key,
        originalUrl: passportUrlString 
      });

      // Read object from S3
      const getObjectCommand = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
      });

      const s3Response = await s3Client.send(getObjectCommand);
      
      if (!s3Response.Body) {
        throw new Error('Empty response body from S3');
      }

      // Convert stream to buffer
      // AWS SDK v3 returns a Readable stream in Node.js
      const stream = s3Response.Body as any;
      const chunks: Buffer[] = [];
      
      // Handle Node.js Readable stream (most common case)
      if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
        // Async iterable stream
        for await (const chunk of stream) {
          chunks.push(Buffer.from(chunk));
        }
        passportImageBuffer = Buffer.concat(chunks);
      } else if (stream instanceof Buffer) {
        // Already a buffer
        passportImageBuffer = stream;
      } else if (stream && typeof stream.on === 'function') {
        // EventEmitter-based stream (Node.js Readable)
        passportImageBuffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = [];
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', () => resolve(Buffer.concat(chunks)));
          stream.on('error', reject);
        });
      } else {
        // Fallback: try to read as array buffer
        const arrayBuffer = await stream.arrayBuffer();
        passportImageBuffer = Buffer.from(arrayBuffer);
      }
    } catch (error: any) {
      console.error('Error fetching passport image from S3:', error);
      console.error('Error details:', {
        passportUrl: passportUrlString,
        bucket: S3_BUCKET,
        message: error.message,
        code: error.code,
      });
      return NextResponse.json(
        { 
          message: 'Failed to fetch passport image from storage',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 500 }
      );
    }

    // Remove data URL prefix if present
    const base64Data = liveImage.includes(',') ? liveImage.split(',')[1] : liveImage;
    const liveImageBuffer = Buffer.from(base64Data, 'base64');

    // Compare faces using AWS Rekognition
    const command = new CompareFacesCommand({
      SourceImage: {
        Bytes: passportImageBuffer,
      },
      TargetImage: {
        Bytes: liveImageBuffer,
      },
      SimilarityThreshold: 80, // Minimum similarity threshold (0-100)
    });

    const result = await rekognitionClient.send(command);

    // Check if faces match
    const faceMatches = result.FaceMatches || [];
    const similarityScore = faceMatches[0]?.Similarity || 0;

    if (similarityScore >= 80) {
      // Calculate next due date (3 months from now)
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 3);

      // Create verification log
      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: 'Face Verification (AWS Rekognition)',
          status: 'VERIFIED',
          verifiedAt: new Date(),
          nextDueAt: nextDueDate,
        },
      });

      // Update pensioner's next due date
      await prisma.pensioner.update({
        where: { id: pensioner.id },
        data: {
          nextDueAt: nextDueDate,
          status: 'VERIFIED',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Verification successful',
        similarityScore: similarityScore.toFixed(2),
        nextDueDate: nextDueDate.toISOString(),
      });
    } else {
      // Verification failed - create log for review
      await prisma.verificationlog.create({
        data: {
          pensionerId: pensioner.id,
          method: 'Face Verification (AWS Rekognition)',
          status: 'FAILED',
          verifiedAt: new Date(),
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Verification failed. Face similarity is below threshold. Please try again or contact support.',
          similarityScore: similarityScore.toFixed(2),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Face verification error:', error);
    return NextResponse.json(
      {
        message: 'Failed to verify face',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

