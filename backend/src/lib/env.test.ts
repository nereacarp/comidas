import { describe, expect, it } from 'vitest';
import { validateEnvironment } from './env';

const valid = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://user:password@db:5432/comidas',
  JWT_SECRET: 'j'.repeat(64),
  ADMIN_SECRET: 'a'.repeat(64),
  ALLOWED_ORIGINS: 'https://comidas.example.com,http://localhost:8080',
  APP_URL: 'https://comidas.example.com',
};

describe('validateEnvironment', () => {
  it('accepts a complete production configuration', () => {
    expect(() => validateEnvironment(valid)).not.toThrow();
  });

  it('rejects missing or short production secrets', () => {
    expect(() => validateEnvironment({ ...valid, JWT_SECRET: 'short' }))
      .toThrow('JWT_SECRET debe tener al menos 32 caracteres');
  });

  it('rejects insecure public origins', () => {
    expect(() => validateEnvironment({ ...valid, ALLOWED_ORIGINS: 'http://comidas.example.com' }))
      .toThrow('Origen de producción no válido');
  });

  it('requires a secure public app URL for private invitation links', () => {
    expect(() => validateEnvironment({ ...valid, APP_URL: '' }))
      .toThrow('APP_URL debe estar definido');
    expect(() => validateEnvironment({ ...valid, APP_URL: 'http://localhost:5175' }))
      .toThrow('APP_URL debe ser un origen HTTPS');
  });
});
