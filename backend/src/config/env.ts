import dotenv from 'dotenv';
dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, defaultValue: string = ''): string {
  return process.env[name] ?? defaultValue;
}

export const env = {
  // === REQUIRED (akan crash kalau tidak di-set) ===
  DATABASE_URL: requireEnv('DATABASE_URL'),
  JWT_SECRET: requireEnv('JWT_SECRET'),
  
  // === OPTIONAL dengan default yang aman ===
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),
  PORT: parseInt(optionalEnv('PORT', '3000'), 10),
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  
  // === CORS & APP URL (REQUIRED untuk production, fallback localhost untuk dev) ===
  CORS_ORIGINS: optionalEnv('CORS_ORIGINS', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  APP_BASE_URL: optionalEnv('APP_BASE_URL', 'http://localhost:5173'),
  
  // === LLM Configuration ===
  PRIMARY_LLM_PROVIDER: optionalEnv('PRIMARY_LLM_PROVIDER', 'google'),
  PRIMARY_LLM_BASE_URL: optionalEnv('PRIMARY_LLM_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
  PRIMARY_LLM_API_KEY: optionalEnv('PRIMARY_LLM_API_KEY'),
  PRIMARY_LLM_MODEL: optionalEnv('PRIMARY_LLM_MODEL'),
  FALLBACK_LLM_PROVIDER: optionalEnv('FALLBACK_LLM_PROVIDER', 'openrouter'),
  FALLBACK_LLM_BASE_URL: optionalEnv('FALLBACK_LLM_BASE_URL', 'https://openrouter.ai/api/v1'),
  FALLBACK_LLM_API_KEY: optionalEnv('FALLBACK_LLM_API_KEY'),
  FALLBACK_LLM_MODEL: optionalEnv('FALLBACK_LLM_MODEL'),
  
  // === Supabase ===
  SUPABASE_URL: optionalEnv('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: optionalEnv('SUPABASE_SERVICE_ROLE_KEY'),
  
  // === Feature Flags ===
  ENABLE_PROJECT_CONTEXT: optionalEnv('ENABLE_PROJECT_CONTEXT') === 'true',
  ENABLE_LANGUAGE_MIRRORING: optionalEnv('ENABLE_LANGUAGE_MIRRORING') === 'true',
  
  // === SMTP ===
  SMTP_HOST: optionalEnv('SMTP_HOST'),
  SMTP_PORT: parseInt(optionalEnv('SMTP_PORT', '587'), 10),
  SMTP_SECURE: optionalEnv('SMTP_SECURE', 'false'),
  SMTP_USER: optionalEnv('SMTP_USER'),
  SMTP_PASS: optionalEnv('SMTP_PASS'),
  MAIL_FROM: optionalEnv('MAIL_FROM', 'ScoprevoTeam<ranggamaster1234@gmail.com>'),
  
  // === REDIS (REQUIRED kalau REDIS_ENABLED=true) ===
  REDIS_ENABLED: optionalEnv('REDIS_ENABLED', 'true') !== 'false',
  REDIS_URL: optionalEnv('REDIS_URL', 'redis://127.0.0.1:6379'),
} as const;

// === VALIDATION: Pastikan config production aman ===
if (env.NODE_ENV === 'production') {
  const warnings: string[] = [];
  
  // Cek CORS_ORIGINS tidak mengandung localhost
  if (env.CORS_ORIGINS.some(origin => origin.includes('localhost'))) {
    warnings.push('⚠️ CORS_ORIGINS masih mengandung localhost di production!');
  }
  
  // Cek APP_BASE_URL tidak localhost
  if (env.APP_BASE_URL.includes('localhost')) {
    warnings.push('⚠️ APP_BASE_URL masih localhost di production!');
  }
  
  // Cek REDIS_URL kalau REDIS_ENABLED
  if (env.REDIS_ENABLED && env.REDIS_URL.includes('127.0.0.1')) {
    warnings.push('⚠️ REDIS_ENABLED=true tapi REDIS_URL masih localhost! Gunakan Upstash Redis.');
  }
  
  // Log warnings (tidak crash, tapi kasih tahu)
  if (warnings.length > 0) {
    console.warn('\n=== PRODUCTION CONFIG WARNINGS ===');
    warnings.forEach(w => console.warn(w));
    console.warn('==================================\n');
  }
}