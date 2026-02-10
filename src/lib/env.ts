const isServer = typeof window === 'undefined';

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  const trimmed = value?.trim();

  return trimmed ? trimmed : undefined;
}

function getRequiredEnv(name: string): string {
  const value = readEnv(name);

  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }

  return value;
}

export function getAppUrl() {
  const configuredUrl = readEnv('NEXT_PUBLIC_APP_URL') ?? readEnv('NEXT_PUBLIC_URL');

  if (configuredUrl) {
    return configuredUrl;
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }

  throw new Error('Defina NEXT_PUBLIC_APP_URL para ambientes de staging/produção.');
}

export function getSupabasePublicEnv() {
  return {
    supabaseUrl: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getServerSecrets() {
  if (!isServer) {
    throw new Error('getServerSecrets só pode ser usado no servidor.');
  }

  return {
    stripeSecretKey: getRequiredEnv('STRIPE_SECRET_KEY'),
    stripeWebhookSecret: readEnv('STRIPE_WEBHOOK_SECRET'),
    supabaseServiceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}
