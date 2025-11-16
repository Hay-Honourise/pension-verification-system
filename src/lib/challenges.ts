import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let inMemoryStore: Map<string, { challenge: Buffer; expiresAt: number }> = new Map();
let useRedis = false;

// Initialize Redis client
export async function initRedis(): Promise<void> {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('⚠️ REDIS_URL not set, using in-memory challenge store (not suitable for production)');
    useRedis = false;
    return;
  }

  try {
    redisClient = createClient({
      url: redisUrl
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      useRedis = false;
    });

    await redisClient.connect();
    useRedis = true;
    console.log('✅ Redis connected for challenge storage');
  } catch (error) {
    console.error('Failed to connect to Redis, falling back to in-memory store:', error);
    useRedis = false;
  }
}

// Clean up expired challenges from in-memory store
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    if (!useRedis) {
      const now = Date.now();
      for (const [key, value] of inMemoryStore.entries()) {
        if (value.expiresAt < now) {
          inMemoryStore.delete(key);
        }
      }
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

/**
 * Store a challenge with TTL
 */
export async function setChallenge(
  key: string,
  challenge: Buffer,
  ttlSeconds: number = 300
): Promise<void> {
  if (useRedis && redisClient) {
    try {
      await redisClient.setEx(key, ttlSeconds, challenge.toString('base64url'));
    } catch (error) {
      console.error('Redis setChallenge error:', error);
      // Fallback to in-memory
      inMemoryStore.set(key, {
        challenge,
        expiresAt: Date.now() + ttlSeconds * 1000
      });
    }
  } else {
    inMemoryStore.set(key, {
      challenge,
      expiresAt: Date.now() + ttlSeconds * 1000
    });
  }
}

/**
 * Get a challenge by key
 */
export async function getChallenge(key: string): Promise<Buffer | null> {
  if (useRedis && redisClient) {
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return Buffer.from(value, 'base64url');
    } catch (error) {
      console.error('Redis getChallenge error:', error);
      // Fallback to in-memory
      const stored = inMemoryStore.get(key);
      if (!stored || stored.expiresAt < Date.now()) {
        inMemoryStore.delete(key);
        return null;
      }
      return stored.challenge;
    }
  } else {
    const stored = inMemoryStore.get(key);
    if (!stored || stored.expiresAt < Date.now()) {
      inMemoryStore.delete(key);
      return null;
    }
    return stored.challenge;
  }
}

/**
 * Delete a challenge
 */
export async function deleteChallenge(key: string): Promise<void> {
  if (useRedis && redisClient) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Redis deleteChallenge error:', error);
      // Fallback to in-memory
      inMemoryStore.delete(key);
    }
  } else {
    inMemoryStore.delete(key);
  }
}

// Initialize on module load (for server-side)
if (typeof window === 'undefined') {
  initRedis().catch(console.error);
}

