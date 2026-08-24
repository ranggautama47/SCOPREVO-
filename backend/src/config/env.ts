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
} as const;
