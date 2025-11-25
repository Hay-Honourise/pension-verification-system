import { CHALLENGE_TTL_SECONDS } from './webauthn-config';
import { setChallenge, getChallenge, deleteChallenge } from './challenges';

export async function storeChallenge(key: string, challenge: string): Promise<void> {
  await setChallenge(key, Buffer.from(challenge, 'base64url'), CHALLENGE_TTL_SECONDS);
}

export async function loadChallenge(key: string): Promise<string | null> {
  const stored = await getChallenge(key);
  if (!stored) {
    return null;
  }
  return stored.toString('base64url');
}

export async function clearChallenge(key: string): Promise<void> {
  await deleteChallenge(key);
}

