const MIN_SECRET_LENGTH = 32;

function requireValue(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} debe estar definido en producción`);
  return value;
}

export function validateEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== 'production') return;

  requireValue(env, 'DATABASE_URL');
  requireValue(env, 'ALLOWED_ORIGINS');
  const appUrl = requireValue(env, 'APP_URL');
  let parsedAppUrl: URL;
  try {
    parsedAppUrl = new URL(appUrl);
  } catch {
    throw new Error('APP_URL debe ser un origen HTTPS sin ruta, consulta ni fragmento');
  }
  if (parsedAppUrl.protocol !== 'https:' || parsedAppUrl.pathname !== '/' || parsedAppUrl.search || parsedAppUrl.hash) {
    throw new Error('APP_URL debe ser un origen HTTPS sin ruta, consulta ni fragmento');
  }

  const jwtSecret = requireValue(env, 'JWT_SECRET');
  if (jwtSecret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres`);
  }

  const credentialsJson = env.ADMIN_CREDENTIALS_JSON?.trim();
  if (credentialsJson) {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(credentialsJson) as Record<string, unknown>;
    } catch {
      throw new Error('ADMIN_CREDENTIALS_JSON debe ser un objeto JSON válido');
    }
    const entries = Object.entries(credentials);
    if (entries.length === 0 || entries.some(([actor, secret]) => !actor.trim() || typeof secret !== 'string' || secret.length < MIN_SECRET_LENGTH)) {
      throw new Error('Cada administrador debe tener identificador y un secreto de al menos 32 caracteres');
    }
  } else {
    const adminSecret = requireValue(env, 'ADMIN_SECRET');
    if (adminSecret.length < MIN_SECRET_LENGTH) {
      throw new Error(`ADMIN_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres`);
    }
  }

  if (env.PUBLIC_REGISTRATION === 'true') {
    if (env.REQUIRE_EMAIL_VERIFICATION !== 'true') {
      throw new Error('REQUIRE_EMAIL_VERIFICATION debe ser true cuando el registro público está habilitado');
    }
    requireValue(env, 'RESEND_API_KEY');
    requireValue(env, 'MAIL_FROM');
  }

  const origins = env.ALLOWED_ORIGINS!.split(',').map((origin) => origin.trim());
  for (const origin of origins) {
    const parsed = new URL(origin);
    const isLocalAdmin = parsed.protocol === 'http:' && parsed.hostname === 'localhost' && parsed.port === '8080';
    if ((!isLocalAdmin && parsed.protocol !== 'https:') || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error(`Origen de producción no válido: ${origin}`);
    }
  }
}
