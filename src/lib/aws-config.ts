import { S3Client } from '@aws-sdk/client-s3';
import { RekognitionClient } from '@aws-sdk/client-rekognition';

// Configure AWS credentials
const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

// Initialize S3 client
export const s3Client = new S3Client(awsConfig);

// Initialize Rekognition client
export const rekognitionClient = new RekognitionClient(awsConfig);

// S3 bucket name
export const S3_BUCKET = process.env.AWS_S3_BUCKET || 'pension-verification-passports';

// Rekognition collection name
export const REKOGNITION_COLLECTION = process.env.AWS_REKOGNITION_COLLECTION || 'teachers-pension-collection';

