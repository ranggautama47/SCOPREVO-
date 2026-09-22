const PROVIDER_KEY = 'scoprevo_llm_provider';
const API_KEY_KEY = 'scoprevo_llm_key';

export type LlmProvider = 'openrouter' | 'google';

export function getLlmProvider(): LlmProvider | null {
  try {
    const value = localStorage.getItem(PROVIDER_KEY);
    if (value === 'openrouter' || value === 'google') {
      return value;
    }
    return null;
  } catch {
    return null;
  }
}

export function setLlmProvider(provider: LlmProvider): void {
  try {
    localStorage.setItem(PROVIDER_KEY, provider);
  } catch {
    // ignore storage errors
  }
}

export function getLlmKey(): string | null {
  try {
    return localStorage.getItem(API_KEY_KEY);
  } catch {
    return null;
  }
}

export function setLlmKey(key: string): void {
  try {
    localStorage.setItem(API_KEY_KEY, key);
  } catch {
    // ignore storage errors
  }
}

export function clearLlmKey(): void {
  try {
    localStorage.removeItem(PROVIDER_KEY);
    localStorage.removeItem(API_KEY_KEY);
  } catch {
    // ignore storage errors
  }
}

export function hasLlmKey(): boolean {
  const provider = getLlmProvider();
  const key = getLlmKey();
  return provider !== null && key !== null && key !== '';
}

export function getLlmHeaders(): Record<string, string> | null {
  const provider = getLlmProvider();
  const key = getLlmKey();

  if (provider && key) {
    return {
      'x-scoprevo-llm-provider': provider,
      'x-scoprevo-llm-key': key,
    };
  }
  return null;
}