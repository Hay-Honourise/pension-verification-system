import { S3Client, PutObjectCommand, DeleteObjectCommand, CopyObjectCommand, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';

const REGION = process.env.S3_REGION || 'us-east-005';
const ENDPOINT = process.env.S3_ENDPOINT || 'https://s3.us-east-005.backblazeb2.com';
const BUCKET = process.env.S3_BUCKET || '';
const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL || '';

if (!process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY || !BUCKET) {
  console.error('Missing S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_BUCKET');
}

const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

// Backwards compatible shim
export async function authenticate() {
  return { authToken: null, downloadUrl: PUBLIC_BASE || null, apiUrl: ENDPOINT || null };
}

// Kept only for compatibility; no real use under S3 flows
export async function getUploadUrl() {
  return { uploadUrl: 's3-compatible', authorizationToken: 'n/a' };
}

export async function uploadFile(fileBuffer: Buffer, fileName: string, contentType: string) {
  if (!BUCKET) throw new Error('S3_BUCKET is not configured');
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType,
  }));
  return {
    fileId: fileName,
    fileName,
    contentType,
    contentLength: fileBuffer.length,
    contentSha1: '',
  };
}

export async function deleteFile(fileId: string, fileName: string) {
  if (!BUCKET) throw new Error('S3_BUCKET is not configured');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: fileId }));
  return { success: true };
}

export async function copyFile(sourceKey: string, newFileName: string) {
  if (!BUCKET) throw new Error('S3_BUCKET is not configured');
  const CopySource = encodeURI(`${BUCKET}/${sourceKey}`);
  await s3.send(new CopyObjectCommand({ Bucket: BUCKET, Key: newFileName, CopySource }));
  return { fileId: newFileName, fileName: newFileName };
}

export async function getSignedUrl(fileName: string, validitySeconds = 3600) {
  if (PUBLIC_BASE) return `${PUBLIC_BASE}/${fileName}`;
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: fileName });
  return await getS3SignedUrl(s3, cmd, { expiresIn: validitySeconds });
}

export function getPublicUrl(fileName: string) {
  if (!PUBLIC_BASE) return `${ENDPOINT}/${BUCKET}/${fileName}`;
  return `${PUBLIC_BASE}/${fileName}`;
}

export async function listFiles(prefix: string, max = 100) {
  const out = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, MaxKeys: max }));
  return (out.Contents || []).map(o => ({ key: o.Key, size: o.Size }));
}

