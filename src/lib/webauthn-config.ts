const DEFAULT_RP_ID = process.env.RP_ID || 'localhost';
const DEFAULT_RP_NAME = process.env.RP_NAME || 'Oyo Pension Verification';
const DEFAULT_ORIGIN =
  process.env.ORIGIN ||
  (DEFAULT_RP_ID === 'localhost' ? 'http://localhost:3000' : `https://${DEFAULT_RP_ID}`);

export const WEB_AUTHN_TIMEOUT_MS = 60_000;
export const CHALLENGE_TTL_SECONDS = 60 * 5;

export function getRpId(): string {
  return DEFAULT_RP_ID;
}

export function getOrigin(): string {
  return DEFAULT_ORIGIN;
}

export function getRpName(): string {
  return DEFAULT_RP_NAME;
}

