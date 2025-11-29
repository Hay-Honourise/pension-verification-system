import { getRedis } from './redis';
import { CHALLENGE_TTL_SECONDS } from './webauthn-config';

/**
 * Store a challenge with TTL in Redis
 */
export async function setChallenge(
  key: string,
  challenge: Buffer,
  ttlSeconds: number = CHALLENGE_TTL_SECONDS
): Promise<void> {
  try {
    const redis = getRedis();
    const challengeBase64 = challenge.toString('base64url');
    await redis.set(key, challengeBase64, { ex: ttlSeconds });
    console.log(`[challenges] Stored challenge key=${key} in Redis (TTL=${ttlSeconds}s)`);
  } catch (error) {
    console.error('[challenges] Redis setChallenge error:', error);
    throw new Error('Failed to store challenge in Redis');
  }
}

/**
 * Get a challenge by key from Redis
 */
export async function getChallenge(key: string): Promise<Buffer | null> {
  try {
    const redis = getRedis();
    const value = await redis.get<string>(key);
    if (!value) {
      console.log(`[challenges] Challenge key=${key} not found in Redis`);
      return null;
    }
    console.log(`[challenges] Retrieved challenge key=${key} from Redis`);
    return Buffer.from(value, 'base64url');
  } catch (error) {
    console.error('[challenges] Redis getChallenge error:', error);
    throw new Error('Failed to retrieve challenge from Redis');
  }
}

/**
 * Delete a challenge from Redis
 */
export async function deleteChallenge(key: string): Promise<void> {
  try {
    const redis = getRedis();
    await redis.del(key);
    console.log(`[challenges] Deleted challenge key=${key} from Redis`);
  } catch (error) {
    console.error('[challenges] Redis deleteChallenge error:', error);
    throw new Error('Failed to delete challenge from Redis');
  }
}
