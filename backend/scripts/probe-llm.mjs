#!/usr/bin/env node
/**
 * probe-llm.mjs — LLM Provider Diagnostic
 * PURPOSE: Verify LLM API keys and connectivity for Primary (Google) and Fallback (OpenRouter)
 * USAGE: node backend/scripts/probe-llm.mjs   (dari repo root)
 *    ATAU dari folder backend/: node scripts/probe-llm.mjs
 * Re-runnable, no side effects, no product code changes.
 */
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// === ROBUST PATH: cari .env dari beberapa lokasi ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const candidatePaths = [
  path.resolve(__dirname, '../.env'),  // script di backend/scripts/ → backend/.env
  path.resolve('backend/.env'),         // CWD = repo root
  path.resolve('.env'),                 // CWD = backend/
];

let envLoaded = false;
let loadedPath = '';
for (const p of candidatePaths) {
  if (fs.existsSync(p)) {
    dotenv.config({ path: p });
    loadedPath = p;
    envLoaded = true;
    break;
  }
}

function maskKey(key) {
  if (!key || key.length < 6) return '(missing or too short)';
  return key.slice(0, 6) + '…';
}

function printProviderConfig(label, provider, baseUrl, apiKey, models) {
  console.log(`\n=== ${label} ===`);
  console.log(`Provider: ${provider}`);
  console.log(`Base URL: ${baseUrl}`);
  console.log(`Primary Model: ${models[0] || '(empty)'}`);
  console.log(`Active Models (${models.length}): ${models.join(', ') || '(empty)'}`);
  console.log(`API Key:  ${maskKey(apiKey)}`);
}

async function probeModel(baseUrl, apiKey, model) {
  if (!apiKey) return { model, status: 'SKIP', reason: 'no key' };
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const payload = {
    model,
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 5,
    temperature: 0,
  };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    const rawBody = await response.text();
    let shortReason = '';
    if (response.status !== 200) {
      try {
        const parsed = JSON.parse(rawBody);
        shortReason = parsed?.error?.message?.slice(0, 80) || rawBody.slice(0, 80);
      } catch {
        shortReason = rawBody.slice(0, 80);
      }
    }
    return { model, status: response.status, reason: shortReason };
  } catch (err) {
    return { model, status: 'NETWORK', reason: err.message };
  }
}

async function probeProvider(label, baseUrl, apiKey, models) {
  console.log(`\n--- Probing ${label} (${models.length} model${models.length === 1 ? '' : 's'}) ---`);
  if (!apiKey) {
    console.log('SKIP: No API key configured');
    return;
  }
  if (models.length === 0) {
    console.log('SKIP: No models configured');
    return;
  }
  for (const model of models) {
    const result = await probeModel(baseUrl, apiKey, model);
    const statusStr = String(result.status).padEnd(8);
    const marker = result.status === 200 ? '✓' : '✗';
    const reason = result.reason ? ` — ${result.reason}` : '';
    console.log(`  ${marker} ${statusStr} ${model}${reason}`);
  }
}

async function main() {
  console.log('=== LLM Provider Diagnostic ===');
  console.log('Loaded .env from:', envLoaded ? loadedPath : '(NOT FOUND)');
  console.log('NODE_ENV:', process.env.NODE_ENV ?? 'unset');

  if (!envLoaded) {
    console.error('\nERROR: .env not found in any expected location.');
    console.error('Tried:');
    candidatePaths.forEach(p => console.error('  -', p));
    process.exit(1);
  }

  // === PRIMARY ===
  const primaryProvider = process.env.PRIMARY_LLM_PROVIDER ?? 'google';
  const primaryBaseUrl = process.env.PRIMARY_LLM_BASE_URL ?? 'https://generativelanguage.googleapis.com/v1beta/openai';
  const primaryApiKey = process.env.PRIMARY_LLM_API_KEY ?? '';
  const primaryModel = process.env.PRIMARY_LLM_MODEL ?? '';
  const activePrimary = (process.env.ACTIVE_PRIMARY_LLM_MODEL ?? '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
  // Gabungkan PRIMARY_LLM_MODEL di depan jika belum ada di list ACTIVE_*
  const primaryModels = primaryModel && !activePrimary.includes(primaryModel)
    ? [primaryModel, ...activePrimary]
    : activePrimary.length > 0 ? activePrimary : (primaryModel ? [primaryModel] : []);

  printProviderConfig('PRIMARY', primaryProvider, primaryBaseUrl, primaryApiKey, primaryModels);

  // === FALLBACK ===
  const fallbackProvider = process.env.FALLBACK_LLM_PROVIDER ?? 'openrouter';
  const fallbackBaseUrl = process.env.FALLBACK_LLM_BASE_URL ?? 'https://openrouter.ai/api/v1';
  const fallbackApiKey = process.env.FALLBACK_LLM_API_KEY ?? '';
  const fallbackModel = process.env.FALLBACK_LLM_MODEL ?? '';
  const activeFallback = (process.env.ACTIVE_FALLBACK_LLM_MODEL ?? '')
    .split(',')
    .map(m => m.trim())
    .filter(Boolean);
  const fallbackModels = fallbackModel && !activeFallback.includes(fallbackModel)
    ? [fallbackModel, ...activeFallback]
    : activeFallback.length > 0 ? activeFallback : (fallbackModel ? [fallbackModel] : []);

  printProviderConfig('FALLBACK', fallbackProvider, fallbackBaseUrl, fallbackApiKey, fallbackModels);

  // === PROBE ALL MODELS ===
  await probeProvider('PRIMARY', primaryBaseUrl, primaryApiKey, primaryModels);
  await probeProvider('FALLBACK', fallbackBaseUrl, fallbackApiKey, fallbackModels);

  console.log('\n=== Diagnostic Complete ===');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});