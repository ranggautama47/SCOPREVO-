export type LogLevel = 'info' | 'warn' | 'error';

export interface StructuredLogPayload {
  event:
    | 'RATE_LIMIT_REDIS_ERROR'
    | 'CACHE_REDIS_ERROR'
    | 'CACHE_INVALIDATION_ERROR'
    | 'CACHE_DESERIALIZATION_ERROR'
    | 'RATE_LIMIT_BLOCKED'
    | string;
  route?: string;
  operation?: string;
  accountId?: string;
  error?: string;
  details?: Record<string, unknown>;
}

const SENSITIVE_KEYS = [
  'authorization',
  'token',
  'magictoken',
  'magic_token',
  'password',
  'jwt',
  'secret',
  'apikey',
  'api_key',
];

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[NESTING_LIMIT]';
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export function logStructured(level: LogLevel, payload: StructuredLogPayload): void {
  const sanitized = sanitize(payload) as StructuredLogPayload;
  const logObj = {
    timestamp: new Date().toISOString(),
    level,
    ...sanitized,
  };

  const output = JSON.stringify(logObj);
  if (level === 'error') {
    console.error(output);
  } else if (level === 'warn') {
    console.warn(output);
  } else {
    console.log(output);
  }
}
