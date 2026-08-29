import crypto from 'crypto';
import { config } from '../config';

const SECRET = config.jwtSecret;

/**
 * Generate a HMAC-SHA256 token for a given packetId + action pair.
 * This is used to authenticate one-click email action links without requiring login.
 */
export function generateActionToken(packetId: string, action: string): string {
  return crypto
    .createHmac('sha256', SECRET)
    .update(`${packetId}:${action}`)
    .digest('hex');
}

/**
 * Verify that a token is valid for the given packetId + action.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyActionToken(
  packetId: string,
  action: string,
  token: string,
): boolean {
  const expected = generateActionToken(packetId, action);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(token, 'hex'),
    );
  } catch {
    return false;
  }
}
