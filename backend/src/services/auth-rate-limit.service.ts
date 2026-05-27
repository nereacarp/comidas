import type { FastifyReply, FastifyRequest } from 'fastify';

export interface AuthRateLimitConfig {
  maxFailures: number;
  lockoutMs: number;
  minAttemptIntervalMs: number;
  ipWindowMs: number;
  maxAttemptsPerIpPerWindow: number;
}

export const DEFAULT_AUTH_RATE_LIMIT_CONFIG: AuthRateLimitConfig = {
  maxFailures: 5,
  lockoutMs: 15 * 60 * 1000,
  minAttemptIntervalMs: 1000,
  ipWindowMs: 60 * 1000,
  maxAttemptsPerIpPerWindow: 30,
};

export type AuthRateLimitDenied = {
  allowed: false;
  statusCode: 429;
  error: string;
  retryAfterSeconds?: number;
};

export type AuthRateLimitAllowed = { allowed: true };

export type AuthRateLimitResult = AuthRateLimitAllowed | AuthRateLimitDenied;

interface CredentialState {
  failures: number;
  lockedUntil?: number;
  lastAttemptAt: number;
}

export function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0]?.trim() || request.ip;
  }
  return request.ip || 'unknown';
}

export function sendAuthRateLimitReply(reply: FastifyReply, denied: AuthRateLimitDenied) {
  if (denied.retryAfterSeconds != null && denied.retryAfterSeconds > 0) {
    reply.header('Retry-After', String(denied.retryAfterSeconds));
  }
  return reply.status(denied.statusCode).send({ error: denied.error });
}

export function createAuthRateLimiter(
  config: AuthRateLimitConfig = DEFAULT_AUTH_RATE_LIMIT_CONFIG,
  now: () => number = () => Date.now(),
) {
  const credentials = new Map<string, CredentialState>();
  const ipAttempts = new Map<string, number[]>();

  function pruneTimestamps(timestamps: number[], t: number): number[] {
    return timestamps.filter((ts) => t - ts < config.ipWindowMs);
  }

  function checkIp(ip: string, t: number): AuthRateLimitResult {
    const key = ip || 'unknown';
    const recent = pruneTimestamps(ipAttempts.get(key) ?? [], t);
    if (recent.length >= config.maxAttemptsPerIpPerWindow) {
      const oldest = recent[0]!;
      return {
        allowed: false,
        statusCode: 429,
        error: 'Demasiados intentos desde esta conexión. Espera un momento e inténtalo de nuevo.',
        retryAfterSeconds: Math.max(1, Math.ceil((config.ipWindowMs - (t - oldest)) / 1000)),
      };
    }
    recent.push(t);
    ipAttempts.set(key, recent);
    return { allowed: true };
  }

  function getCredential(key: string): CredentialState {
    return credentials.get(key) ?? { failures: 0, lastAttemptAt: 0 };
  }

  function checkCredential(key: string, t: number, lockoutMessage: string): AuthRateLimitResult {
    const state = getCredential(key);
    if (state.lockedUntil != null && t < state.lockedUntil) {
      return {
        allowed: false,
        statusCode: 429,
        error: lockoutMessage,
        retryAfterSeconds: Math.max(1, Math.ceil((state.lockedUntil - t) / 1000)),
      };
    }
    if (state.lastAttemptAt > 0 && t - state.lastAttemptAt < config.minAttemptIntervalMs) {
      const waitMs = config.minAttemptIntervalMs - (t - state.lastAttemptAt);
      return {
        allowed: false,
        statusCode: 429,
        error: 'Espera un segundo entre intentos.',
        retryAfterSeconds: Math.max(1, Math.ceil(waitMs / 1000)),
      };
    }
    return { allowed: true };
  }

  function markCredentialAttempt(key: string, t: number) {
    const state = getCredential(key);
    state.lastAttemptAt = t;
    credentials.set(key, state);
  }

  function mergeDenied(...checks: AuthRateLimitResult[]): AuthRateLimitResult {
    return checks.find((c) => !c.allowed) ?? { allowed: true };
  }

  return {
    checkLoginAttempt(ip: string, email: string, t = now()) {
      const emailKey = `login:${email.trim().toLowerCase()}`;
      return mergeDenied(
        checkIp(ip, t),
        checkCredential(
          emailKey,
          t,
          'Demasiados intentos fallidos. Esta cuenta está bloqueada temporalmente; inténtalo en unos minutos.',
        ),
      );
    },

    markLoginAttempt(email: string, t = now()) {
      markCredentialAttempt(`login:${email.trim().toLowerCase()}`, t);
    },

    loginFailed(email: string, t = now()) {
      const key = `login:${email.trim().toLowerCase()}`;
      const state = getCredential(key);
      state.failures += 1;
      state.lastAttemptAt = t;
      if (state.failures >= config.maxFailures) {
        state.lockedUntil = t + config.lockoutMs;
      }
      credentials.set(key, state);
    },

    loginSucceeded(email: string) {
      credentials.delete(`login:${email.trim().toLowerCase()}`);
    },

    loginFailureMessage(email: string): string {
      const state = getCredential(`login:${email.trim().toLowerCase()}`);
      if (state.lockedUntil != null) {
        return 'Demasiados intentos fallidos. Esta cuenta está bloqueada temporalmente.';
      }
      const remaining = config.maxFailures - state.failures;
      if (remaining > 0 && remaining < config.maxFailures) {
        return `Credenciales incorrectas. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`;
      }
      return 'Credenciales incorrectas';
    },

    checkRegisterAttempt(ip: string, t = now()) {
      return mergeDenied(
        checkIp(ip, t),
        checkCredential(
          `register:${ip}`,
          t,
          'Demasiados intentos de registro. Espera unos minutos antes de volver a intentarlo.',
        ),
      );
    },

    markRegisterAttempt(ip: string, t = now()) {
      markCredentialAttempt(`register:${ip}`, t);
    },

    checkDeleteAccountAttempt(ip: string, userId: string, t = now()) {
      const key = `delete:${userId}`;
      return mergeDenied(
        checkIp(ip, t),
        checkCredential(
          key,
          t,
          'Demasiados intentos fallidos. Vuelve a intentarlo en unos minutos.',
        ),
      );
    },

    markDeleteAccountAttempt(userId: string, t = now()) {
      markCredentialAttempt(`delete:${userId}`, t);
    },

    deleteAccountFailed(userId: string, t = now()) {
      const key = `delete:${userId}`;
      const state = getCredential(key);
      state.failures += 1;
      state.lastAttemptAt = t;
      if (state.failures >= config.maxFailures) {
        state.lockedUntil = t + config.lockoutMs;
      }
      credentials.set(key, state);
    },

    deleteAccountSucceeded(userId: string) {
      credentials.delete(`delete:${userId}`);
    },

    deleteAccountFailureMessage(userId: string): string {
      const state = getCredential(`delete:${userId}`);
      if (state.lockedUntil != null) {
        return 'Demasiados intentos fallidos. Vuelve a intentarlo más tarde.';
      }
      const remaining = config.maxFailures - state.failures;
      if (remaining > 0 && remaining < config.maxFailures) {
        return `Contraseña incorrecta. Te quedan ${remaining} intento${remaining === 1 ? '' : 's'}.`;
      }
      return 'Contraseña incorrecta';
    },
  };
}

export type AuthRateLimiter = ReturnType<typeof createAuthRateLimiter>;
