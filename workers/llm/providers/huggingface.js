const fetch = global.fetch || require('node-fetch');
const HF_API_KEY = process.env.HF_API_KEY || process.env.HUGGINGFACE_API_KEY || null;
const HF_MODEL = process.env.HUGGINGFACE_MODEL || process.env.HF_MODEL || 'google/flan-t5-small';

async function init() {
  if (!HF_API_KEY) return; // nothing to initialize
}

async function callHF(prompt) {
  if (!HF_API_KEY) throw new Error('no_huggingface_api_key');
  const url = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${HF_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } })
  });
  if (!res.ok) throw new Error('huggingface_call_failed:' + res.status);
  const body = await res.json();
  // HF may return array or object; try to extract text
  if (Array.isArray(body) && body[0] && body[0].generated_text) return body[0].generated_text;
  if (body && body.generated_text) return body.generated_text;
  if (typeof body === 'string') return body;
  return JSON.stringify(body);
}

module.exports = {
  init,

  async extractNamesFromReview(text, opts = {}) {
    try {
      const prompt = `Extract any person names mentioned in the following review. Respond as a comma-separated list or empty string:\n\n${text}`;
      const out = await callHF(prompt);
      return (''+out).split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
    } catch (e) {
      return [];
    }
  },

  async analyzeSentiment(text, opts = {}) {
    try {
      const prompt = `Rate the sentiment of the following review on a scale -2 (very negative) to +2 (very positive). Respond with a single integer:\n\n${text}`;
      const out = await callHF(prompt);
      const n = parseInt((''+out).trim(), 10);
      return Number.isFinite(n) ? n : 0;
    } catch (e) {
      return 0;
    }
  },

  async summarizeReview(text, maxWords = 20, opts = {}) {
    try {
      const prompt = `Summarize the following review in ${maxWords} words or less:\n\n${text}`;
      const out = await callHF(prompt);
      return (''+out).trim().split('\n').map(l=>l.trim()).join(' ');
    } catch (e) {
      return (text||'').split(' ').slice(0, maxWords).join(' ');
    }
  },

  async extractAdjectivesFromReview(text, opts = {}) {
    try {
      const prompt = `List descriptive adjectives used in the following review as a comma-separated list:\n\n${text}`;
      const out = await callHF(prompt);
      return (''+out).split(/[,\n]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
    } catch (e) {
      return [];
    }
  }
};
