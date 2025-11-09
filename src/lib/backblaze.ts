import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, GetObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as awsGetSignedUrl } from '@aws-sdk/s3-request-presigner';

const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || '';
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || '';
const S3_BUCKET = process.env.S3_BUCKET || '';
const S3_PUBLIC_BASE_URL = process.env.S3_PUBLIC_BASE_URL || '';
const S3_ENDPOINT = process.env.S3_ENDPOINT || '';
const S3_REGION = process.env.S3_REGION || 'us-east-1';

// Debug environment variables (safe)
console.log('S3 Configuration:', {
  S3_ACCESS_KEY_ID: S3_ACCESS_KEY_ID ? 'SET' : 'MISSING',
  S3_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
  S3_BUCKET: S3_BUCKET || 'MISSING',
  S3_PUBLIC_BASE_URL: S3_PUBLIC_BASE_URL ? 'SET' : 'MISSING',
  S3_ENDPOINT: S3_ENDPOINT || 'MISSING',
  S3_REGION: S3_REGION || 'MISSING'
});

function createS3Client(): S3Client {
  if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET || !S3_ENDPOINT || !S3_REGION) {
    throw new Error('Missing required S3 environment variables');
  }
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });
}

// No-op for S3; kept for API compatibility if referenced elsewhere
export async function authenticate() {
  return { authToken: '', downloadUrl: S3_PUBLIC_BASE_URL || S3_ENDPOINT, apiUrl: S3_ENDPOINT };
}

export async function uploadFile(fileBuffer: Buffer, fileName: string, contentType: string) {
  try {
    console.log('uploadFile called with:', { fileName, contentType, bufferSize: fileBuffer.length });
    const s3 = createS3Client();
    const put = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    });
    await s3.send(put);
    console.log('Upload successful:', { key: fileName, bucket: S3_BUCKET });
    return {
      fileId: fileName,
      fileName: fileName,
      contentType,
      contentLength: fileBuffer.length,
      contentSha1: undefined as unknown as string,
    };
  } catch (error) {
    console.error('Upload failed:', error);
    console.error('Upload error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileName,
      contentType,
      bufferSize: fileBuffer.length
    });
    throw new Error('Upload failed');
  }
}

export async function deleteFile(fileId: string, fileName: string) {
  try {
    const s3 = createS3Client();
    await s3.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: fileName || fileId }));
    return { success: true };
  } catch (error) {
    console.error('Delete failed:', error);
    throw new Error('Delete failed');
  }
}

export async function copyFile(sourceFileId: string, newFileName: string) {
  try {
    console.log('Copying file:', { sourceFileId, newFileName });
    const s3 = createS3Client();
    await s3.send(new CopyObjectCommand({
      Bucket: S3_BUCKET,
      Key: newFileName,
      CopySource: `${S3_BUCKET}/${sourceFileId}`,
    }));
    return { fileId: newFileName, fileName: newFileName };
  } catch (error) {
    console.error('Copy failed:', error);
    throw new Error('Copy failed');
  }
}

export async function getSignedUrl(fileName: string, validitySeconds = 3600, bucketName?: string) {
  try {
    const bucket = bucketName || S3_BUCKET;
    console.log('getSignedUrl called with:', { fileName, bucket, usingEnvBucket: !bucketName });
    const s3 = createS3Client();
    const command = new GetObjectCommand({ Bucket: bucket, Key: fileName });
    return await awsGetSignedUrl(s3, command, { expiresIn: validitySeconds });
  } catch (error) {
    console.error('Failed to get signed URL:', error);
    console.error('Error details:', {
      fileName,
      bucket: bucketName || S3_BUCKET,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error('Failed to get signed URL');
  }
}

export async function generateDownloadUrl(fileUrl: string, filename?: string) {
  try {
    console.log('Generating S3 download URL for:', fileUrl);
    console.log('Current S3_BUCKET from env:', S3_BUCKET);
    console.log('Current S3_PUBLIC_BASE_URL from env:', S3_PUBLIC_BASE_URL);
    
    // If a public base URL is configured, prefer it
    if (S3_PUBLIC_BASE_URL && !fileUrl.includes('http')) {
      return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${fileUrl}`;
    }
    
    // If it's already a URL, try to extract bucket and key from Backblaze URL
    if (fileUrl.startsWith('http')) {
      // Check if it's a Backblaze B2 URL
      // Format: https://f003.backblazeb2.com/file/{bucket}/{key}
      // Also handle: https://f003.backblazeb2.com/file/{bucket}/{key/path}
      const backblazePattern = /https?:\/\/[^\/]+\/file\/([^\/]+)\/(.+)/;
      const match = fileUrl.match(backblazePattern);
      
      if (match) {
        const bucketFromUrl = match[1];
        const keyFromUrl = match[2];
        console.log('Extracted from Backblaze URL:', { 
          bucketFromUrl, 
          keyFromUrl,
          fullUrl: fileUrl 
        });
        console.log('Environment S3_BUCKET:', S3_BUCKET);
        console.log('Bucket comparison:', {
          urlBucket: bucketFromUrl,
          envBucket: S3_BUCKET,
          match: bucketFromUrl === S3_BUCKET,
          caseSensitive: bucketFromUrl.toLowerCase() === S3_BUCKET.toLowerCase()
        });
        
        // Always use the bucket from the URL since that's where the file actually is
        // This handles cases where the URL bucket differs from env bucket
        console.log(`Using bucket from URL: "${bucketFromUrl}" for key: "${keyFromUrl}"`);
        return await getSignedUrl(keyFromUrl, 3600, bucketFromUrl);
      }
      
      // If it's not a Backblaze URL or doesn't match pattern, return as-is
      console.log('URL does not match Backblaze pattern, returning as-is');
      console.log('URL pattern check failed for:', fileUrl);
      return fileUrl;
    }
    
    // Otherwise, return a presigned URL using env bucket
    console.log('Using fileUrl as key with env bucket:', S3_BUCKET);
    return await getSignedUrl(fileUrl, 3600);
  } catch (error) {
    console.error('Error generating download URL:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      fileUrl,
      filename,
      envBucket: S3_BUCKET,
      publicBaseUrl: S3_PUBLIC_BASE_URL
    });
    
    // Try to extract bucket info for better error message
    if (fileUrl.startsWith('http')) {
      const backblazePattern = /https?:\/\/[^\/]+\/file\/([^\/]+)\/(.+)/;
      const match = fileUrl.match(backblazePattern);
      if (match) {
        console.error('Failed to generate presigned URL for:', {
          bucketFromUrl: match[1],
          keyFromUrl: match[2],
          envBucket: S3_BUCKET
        });
      }
    }
    
    // Return the original URL as fallback
    console.log('Returning original URL as fallback');
    return fileUrl;
  }
}

export async function getPublicUrl(fileName: string) {
  if (S3_PUBLIC_BASE_URL) {
    return `${S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${fileName}`;
  }
  // Fallback to presigned URL if no public base URL is configured
  return await getSignedUrl(fileName, 3600);
}

export async function listFiles(prefix: string, max = 100) {
  try {
    const s3 = createS3Client();
    const res = await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: prefix, MaxKeys: max }));
    return (res.Contents || []).map(f => ({ key: f.Key || '', size: Number(f.Size || 0) }));
  } catch (error) {
    console.error('List files failed:', error);
    throw new Error('List files failed');
  }
}

export async function testS3Connection() {
  try {
    console.log('Testing S3 connection...');
    if (!S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_BUCKET || !S3_ENDPOINT || !S3_REGION) {
      return {
        success: false,
        error: 'Missing required environment variables',
        details: {
          S3_ACCESS_KEY_ID: S3_ACCESS_KEY_ID ? 'SET' : 'MISSING',
          S3_SECRET_ACCESS_KEY: S3_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
          S3_BUCKET: S3_BUCKET || 'MISSING',
          S3_ENDPOINT: S3_ENDPOINT || 'MISSING',
          S3_REGION: S3_REGION || 'MISSING'
        }
      };
    }
    const s3 = createS3Client();
    await s3.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
    await s3.send(new ListObjectsV2Command({ Bucket: S3_BUCKET, MaxKeys: 1 }));
    return { success: true, message: 'S3 connection working', configuration: { bucket: S3_BUCKET, endpoint: S3_ENDPOINT, region: S3_REGION } };
  } catch (error) {
    console.error('S3 connection failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error', details: error, configuration: { bucket: S3_BUCKET } };
  }
}

