import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAuthRateLimiter,
  DEFAULT_AUTH_RATE_LIMIT_CONFIG,
} from './auth-rate-limit.service.js';

describe('auth-rate-limit', () => {
  let now: number;
  let limiter: ReturnType<typeof createAuthRateLimiter>;

  beforeEach(() => {
    now = 1_000_000;
    limiter = createAuthRateLimiter(
      {
        ...DEFAULT_AUTH_RATE_LIMIT_CONFIG,
        maxFailures: 3,
        lockoutMs: 60_000,
        minAttemptIntervalMs: 1000,
        ipWindowMs: 10_000,
        maxAttemptsPerIpPerWindow: 5,
      },
      () => now,
    );
  });

  it('blocks login after max failures', () => {
    limiter.markLoginAttempt('user@test.com');
    limiter.loginFailed('user@test.com');
    limiter.loginFailed('user@test.com');
    limiter.loginFailed('user@test.com');

    const check = limiter.checkLoginAttempt('1.2.3.4', 'user@test.com');
    expect(check.allowed).toBe(false);
    if (!check.allowed) {
      expect(check.statusCode).toBe(429);
      expect(check.error).toContain('bloqueada');
    }
  });

  it('clears failures on successful login', () => {
    limiter.loginFailed('user@test.com');
    limiter.loginFailed('user@test.com');
    limiter.loginSucceeded('user@test.com');

    expect(limiter.checkLoginAttempt('1.2.3.4', 'user@test.com').allowed).toBe(true);
  });

  it('enforces minimum interval between attempts', () => {
    limiter.markLoginAttempt('user@test.com');
    now += 200;
    const check = limiter.checkLoginAttempt('1.2.3.4', 'user@test.com');
    expect(check.allowed).toBe(false);
    if (!check.allowed) {
      expect(check.error).toContain('segundo');
    }
  });

  it('limits attempts per IP in a sliding window', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(limiter.checkRegisterAttempt('9.9.9.9').allowed).toBe(true);
      limiter.markRegisterAttempt('9.9.9.9');
      now += 1100;
    }
    const blocked = limiter.checkRegisterAttempt('9.9.9.9');
    expect(blocked.allowed).toBe(false);
  });

  it('reports remaining login attempts in failure message', () => {
    limiter.loginFailed('user@test.com');
    expect(limiter.loginFailureMessage('user@test.com')).toContain('2 intentos');
  });

  it('blocks delete account after repeated wrong passwords', () => {
    limiter.markDeleteAccountAttempt('user-1');
    limiter.deleteAccountFailed('user-1');
    limiter.deleteAccountFailed('user-1');
    limiter.deleteAccountFailed('user-1');

    const check = limiter.checkDeleteAccountAttempt('1.2.3.4', 'user-1');
    expect(check.allowed).toBe(false);
  });
});
