import { Redis } from '@upstash/redis';

let redis: Redis | null = null;

// Initialize Redis only if environment variables are available
if (process.env.REDIS_URL && process.env.REDIS_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN,
    });
    console.log('✅ Redis (Upstash) initialized for challenge storage');
  } catch (error) {
    console.error('❌ Failed to initialize Redis:', error);
  }
} else {
  console.warn('⚠️ REDIS_URL and REDIS_TOKEN not set. Challenge storage will fail. Please configure Redis for production.');
}

// Export a getter that throws if Redis is not initialized
export function getRedis(): Redis {
  if (!redis) {
    throw new Error(
      'Redis is not initialized. REDIS_URL and REDIS_TOKEN environment variables are required for challenge storage.'
    );
  }
  return redis;
}

// Export redis directly for convenience (will be null if not initialized)
export { redis };

