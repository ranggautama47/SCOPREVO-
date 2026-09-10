import dotenv from 'dotenv';
dotenv.config();
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
export const env = {
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  PORT: parseInt(process.env.PORT ?? '3000', 10),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  CORS_ORIGINS: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  PRIMARY_LLM_PROVIDER: process.env.PRIMARY_LLM_PROVIDER ?? 'google',
  PRIMARY_LLM_BASE_URL: process.env.PRIMARY_LLM_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai',
  PRIMARY_LLM_API_KEY: process.env.PRIMARY_LLM_API_KEY ?? '',
  PRIMARY_LLM_MODEL: process.env.PRIMARY_LLM_MODEL ?? '',
  FALLBACK_LLM_PROVIDER: process.env.FALLBACK_LLM_PROVIDER ?? 'openrouter',
  FALLBACK_LLM_BASE_URL: process.env.FALLBACK_LLM_BASE_URL ?? 'https://openrouter.ai/api/v1',
  FALLBACK_LLM_API_KEY: process.env.FALLBACK_LLM_API_KEY ?? '',
  FALLBACK_LLM_MODEL: process.env.FALLBACK_LLM_MODEL ?? '',
  SUPABASE_URL: process.env.SUPABASE_URL ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  ENABLE_PROJECT_CONTEXT: process.env.ENABLE_PROJECT_CONTEXT === 'true',
  ENABLE_LANGUAGE_MIRRORING: process.env.ENABLE_LANGUAGE_MIRRORING === 'true',
  SMTP_HOST: process.env.SMTP_HOST ?? '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT ?? '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE ?? 'false',
  SMTP_USER: process.env.SMTP_USER ?? '',
  SMTP_PASS: process.env.SMTP_PASS ?? '',
  APP_BASE_URL: process.env.APP_BASE_URL ?? 'http://localhost:5173',
  MAIL_FROM: process.env.MAIL_FROM ?? 'noreply@scoprevo.com',
  REDIS_URL: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
  REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false',
} as const;
