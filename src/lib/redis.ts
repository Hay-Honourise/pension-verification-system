import { Redis } from '@upstash/redis';

if (!process.env.REDIS_URL || !process.env.REDIS_TOKEN) {
  throw new Error(
    'REDIS_URL and REDIS_TOKEN environment variables are required for challenge storage'
  );
}

export const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
});

console.log('✅ Redis (Upstash) initialized for challenge storage');

