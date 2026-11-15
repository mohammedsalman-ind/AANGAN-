import { describe, it, expect } from 'vitest';
import { hashPin, verifyPin, isMemberLocked } from '../auth/pin.js';
import { signActionToken, verifyActionToken } from '../auth/jwt.js';

describe('Authentication & Security', () => {
  it('correctly hashes and verifies PIN using scrypt with random salt', async () => {
    const pin = '1111';
    const hash = await hashPin(pin);

    expect(hash).toContain(':');
    const isMatch = await verifyPin(pin, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await verifyPin('9999', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('correctly calculates and enforces 5-minute lockout', () => {
    expect(isMemberLocked(null)).toBe(false);

    const future = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    expect(isMemberLocked(future)).toBe(true);

    const past = new Date(Date.now() - 1000).toISOString();
    expect(isMemberLocked(past)).toBe(false);
  });

  it('generates, verifies, and expires HMAC action tokens for one-click email links', () => {
    const payload = {
      action: 'ack_missed' as const,
      circleId: 'circle-1',
      memberId: 'member-1',
      expiresAt: Date.now() + 60000,
      nonce: 'nonce-123',
    };

    const token = signActionToken(payload);
    expect(typeof token).toBe('string');
    expect(token).toContain('.');

    const verified = verifyActionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.action).toBe('ack_missed');
    expect(verified?.memberId).toBe('member-1');

    // Test tamper resistance
    const tampered = token.slice(0, -4) + 'abcd';
    expect(verifyActionToken(tampered)).toBeNull();

    // Test expired token
    const expiredPayload = { ...payload, expiresAt: Date.now() - 1000 };
    const expiredToken = signActionToken(expiredPayload);
    expect(verifyActionToken(expiredToken)).toBeNull();
  });
});
