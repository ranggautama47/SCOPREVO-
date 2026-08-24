import { env } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { AIResponseOutput, aiResponseSchema } from '../validators/ai-response.schema';

const SYSTEM_PROMPT = `You are SCOPREVO Revision Intelligence Engine.
Analyze the client feedback and extract actionable revision items.
Return JSON only in this exact shape:
{"summary":"...","items":[{"description":"...","scope":"IN_SCOPE"},{"description":"...","scope":"OUT_OF_SCOPE","reason":"..."},{"description":"...","scope":"NEEDS_REVIEW","reason":"..."}]}
Use IN_SCOPE, OUT_OF_SCOPE, or NEEDS_REVIEW.
OUT_OF_SCOPE always requires a non-empty reason.
NEEDS_REVIEW is for ambiguous items you are unsure about (e.g. unclear whether covered by the contract);
it also requires a non-empty reason explaining the ambiguity.`;

export interface ProviderConfig {
  provider: string;
  baseURL: string;
  apiKey: string;
  model: string;
}

interface ProviderFailure extends Error {
  kind: 'network' | 'timeout' | 'http' | 'parse' | 'schema';
  status?: number;
  provider: string;
}

const providers: ProviderConfig[] = [
  {
    provider: env.PRIMARY_LLM_PROVIDER,
    baseURL: env.PRIMARY_LLM_BASE_URL,
    apiKey: env.PRIMARY_LLM_API_KEY,
    model: env.PRIMARY_LLM_MODEL,
  },
  {
    provider: env.FALLBACK_LLM_PROVIDER,
    baseURL: env.FALLBACK_LLM_BASE_URL,
    apiKey: env.FALLBACK_LLM_API_KEY,
    model: env.FALLBACK_LLM_MODEL,
  },
];

function providerFailure(
  provider: ProviderConfig,
  kind: ProviderFailure['kind'],
  message: string,
  status?: number,
): ProviderFailure {
  const error = new Error(message) as ProviderFailure;
  error.kind = kind;
  error.provider = provider.provider;
  error.status = status;
  return error;
}

function shouldFallback(error: ProviderFailure): boolean {
  return error.kind === 'network'
    || error.kind === 'timeout'
    || error.status === 429
    || (error.status !== undefined && error.status >= 500);
}

function parseAndValidate(provider: ProviderConfig, content: string): AIResponseOutput {
  const cleaned = content.trim()
    .replace(/^```json\s*/i, '')
    .replace(/```\s*$/, '');

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw providerFailure(provider, 'parse', 'Provider returned invalid JSON.');
  }

  const result = aiResponseSchema.safeParse(parsed);
  if (!result.success) {
    throw providerFailure(provider, 'schema', 'Provider returned invalid revision schema.');
  }
  return result.data;
}

async function requestProvider(provider: ProviderConfig, rawInput: string): Promise<string> {
  if (!provider.apiKey || !provider.model) {
    throw providerFailure(provider, 'http', `${provider.provider} provider is not configured.`);
  }

  const endpoint = `${provider.baseURL.replace(/\/+$/, '')}/chat/completions`;
  console.info(`[AI] provider=${provider.provider} endpoint=${provider.baseURL} model=${provider.model}`);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45_000);

  try {
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: rawInput },
          ],
          temperature: 0.1,
        }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw providerFailure(provider, 'timeout', 'Provider request timed out.');
      }
      throw providerFailure(provider, 'network', 'Provider request failed.');
    }

    if (!response.ok) {
      throw providerFailure(provider, 'http', `Provider returned HTTP ${response.status}.`, response.status);
    }

    const json = await response.json() as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw providerFailure(provider, 'parse', 'Provider returned no message content.');
    }
    return content;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestAndValidate(provider: ProviderConfig, rawInput: string): Promise<AIResponseOutput> {
  let lastFailure: ProviderFailure | undefined;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return parseAndValidate(provider, await requestProvider(provider, rawInput));
    } catch (error) {
      const failure = error as ProviderFailure;
      lastFailure = failure;
      if (failure.kind === 'network' || failure.kind === 'timeout' || failure.kind === 'http') {
        throw failure;
      }
      console.warn(`[AI] provider=${provider.provider} attempt=${attempt} output validation failed`);
    }
  }
  throw lastFailure ?? providerFailure(provider, 'schema', 'Provider output validation failed.');
}

export const aiService = {
  async callGoogleAI(rawInput: string): Promise<AIResponseOutput> {
    return requestAndValidate(providers[0], rawInput);
  },

  async callOpenRouter(rawInput: string): Promise<AIResponseOutput> {
    return requestAndValidate(providers[1], rawInput);
  },

  async extractRevisions(rawInput: string): Promise<AIResponseOutput> {
    const primary = providers[0];
    const fallback = providers[1];

    try {
      return await this.callGoogleAI(rawInput);
    } catch (error) {
      if (!shouldFallback(error as ProviderFailure)) {
        throw new AppError('AI_PROCESSING_FAILED', 'Feedback could not be analyzed.', 422);
      }
      console.warn(`[AI] primary provider=${primary.provider} unavailable; falling back to ${fallback.provider}`);
    }

    try {
      return await this.callOpenRouter(rawInput);
    } catch {
      throw new AppError('AI_PROCESSING_FAILED', 'Feedback could not be analyzed.', 422);
    }
  },
};
