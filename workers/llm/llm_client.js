/**
 * Provider-agnostic LLM facade.
 * Exposes the small set of helpers used by the codebase and normalizes outputs.
 */
const DEFAULT_PROVIDER = process.env.LLM_PROVIDER || 'ollama';
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS || 12000);
const LLM_MAX_RETRIES = Number(process.env.LLM_MAX_RETRIES || 1);

// Load available providers
const providers = {};
try { providers.openai = require('./providers/openai'); } catch (e) {}
try { providers.anthropic = require('./providers/anthropic'); } catch (e) {}
try { providers.ollama = require('./providers/ollama'); } catch (e) {}
try { providers.huggingface = require('./providers/huggingface'); } catch (e) {}
try { providers.replicate = require('./providers/replicate'); } catch (e) {}

// Determine active provider using LLM_PROVIDER, then fallback list, then defaults
function pickActiveProvider() {
  const envChoice = process.env.LLM_PROVIDER;
  if (envChoice && providers[envChoice]) return envChoice;
  const fallbackCsv = process.env.LLM_PROVIDER_FALLBACK || '';
  const fallbacks = fallbackCsv.split(',').map(s=>s.trim()).filter(Boolean);
  for (const f of fallbacks) if (providers[f]) return f;
  if (DEFAULT_PROVIDER in providers) return DEFAULT_PROVIDER;
  if (providers.ollama) return 'ollama';
  const keys = Object.keys(providers);
  return keys.length ? keys[0] : null;
}

let activeProvider = pickActiveProvider();

async function init() {
  if (providers[activeProvider] && typeof providers[activeProvider].init === 'function') {
    try { await providers[activeProvider].init(); } catch (e) { console.warn('provider init failed', e && e.message); }
  }
}

async function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('llm_timeout')) , ms);
    promise.then(r => { clearTimeout(t); resolve(r); }).catch(err => { clearTimeout(t); reject(err); });
  });
}

async function callProviderTask(taskName, text, options = {}) {
  const providerName = process.env.LLM_PROVIDER || activeProvider;
  const provider = providers[providerName] || providers.ollama;
  if (!provider) throw new Error('no_llm_provider_available');

  // Retries for transient errors
  let lastErr = null;
  for (let attempt = 0; attempt <= LLM_MAX_RETRIES; attempt++) {
    try {
      const p = provider[taskName](text, options);
      const res = await withTimeout(p, options.timeoutMs || LLM_TIMEOUT_MS);
      return { success: true, provider: providerName, output: res, raw: res };
    } catch (err) {
      lastErr = err;
      // for non-retryable errors, break
      if (err && err.message && /(auth|invalid|bad_request)/i.test(err.message)) break;
      // otherwise small backoff
      await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
    }
  }
  return { success: false, provider: providerName, error: lastErr && (lastErr.message || String(lastErr)) };
}

// Facade helpers used by the app
async function extractNamesFromReview(text, opts = {}) {
  const r = await callProviderTask('extractNamesFromReview', text, opts);
  if (r.success) {
    // provider may return array or text
    if (Array.isArray(r.output)) return r.output;
    if (typeof r.output === 'string') return r.output.split(',').map(s => s.trim()).filter(Boolean);
  }
  // fallback to ollama provider heuristics if present
  if (providers.ollama && providerFallbackAvailable(providers.ollama)) {
    try { return await providers.ollama.extractNamesFromReview(text, opts); } catch (e) { }
  }
  return [];
}

async function analyzeSentiment(text, opts = {}) {
  const r = await callProviderTask('analyzeSentiment', text, opts);
  if (r.success) {
    const v = r.output;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseInt(v.trim(),10) || 0;
  }
  if (providers.ollama && providerFallbackAvailable(providers.ollama)) {
    try { return await providers.ollama.analyzeSentiment(text, opts); } catch (e) { }
  }
  return 0;
}

async function summarizeReview(text, maxWords = 20, opts = {}) {
  const r = await callProviderTask('summarizeReview', { text, maxWords }, opts);
  if (r.success) {
    if (typeof r.output === 'string') return r.output;
    if (r.output && r.output.summary) return r.output.summary;
  }
  if (providers.ollama && providerFallbackAvailable(providers.ollama)) {
    try { return await providers.ollama.summarizeReview(text, maxWords, opts); } catch (e) { }
  }
  return (text || '').split(' ').slice(0, maxWords).join(' ') + ((text||'').split(' ').length > maxWords ? '…' : '');
}

async function extractAdjectivesFromReview(text, opts = {}) {
  const r = await callProviderTask('extractAdjectivesFromReview', text, opts);
  if (r.success) {
    if (Array.isArray(r.output)) return r.output.map(s => (''+s).toLowerCase());
    if (typeof r.output === 'string') return r.output.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }
  if (providers.ollama && providerFallbackAvailable(providers.ollama)) {
    try { return await providers.ollama.extractAdjectivesFromReview(text, opts); } catch (e) { }
  }
  return [];
}

function providerFallbackAvailable(p) { return p && typeof p.extractNamesFromReview === 'function'; }

module.exports = {
  init,
  extractNamesFromReview,
  analyzeSentiment,
  summarizeReview,
  extractAdjectivesFromReview,
};
