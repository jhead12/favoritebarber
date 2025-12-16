const fetch = global.fetch || require('node-fetch');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function init() {
  if (!OPENAI_API_KEY) console.warn('OPENAI_API_KEY not set; OpenAI adapter will fail until configured');
}

async function extractNamesFromReview(text) {
  const prompt = `Extract ONLY up to 3 personal first names mentioned in this review as a comma-separated list, or respond with NONE if none found.\nReview: "${text.replace(/"/g,'\\"')}"\nNames:`;
  const res = await callOpenAI(prompt, { max_tokens: 60 });
  return parseNamesFromText(res || '');
}

async function analyzeSentiment(text) {
  const prompt = `Respond with only one number: -1 for negative, 0 for neutral, 1 for positive.\nReview: "${text.replace(/"/g,'\\"')}"\nSentiment:`;
  const res = await callOpenAI(prompt, { max_tokens: 4 });
  const n = parseInt((res||'').trim(),10);
  return Number.isFinite(n) ? n : 0;
}

async function summarizeReview(payload) {
  const text = payload && payload.text ? payload.text : payload;
  const maxWords = payload && payload.maxWords ? payload.maxWords : 20;
  const prompt = `Summarize this review in ${maxWords} words or fewer.\nReview: "${String(text).replace(/"/g,'\\"')}"\nSummary:`;
  const res = await callOpenAI(prompt, { max_tokens: Math.min(200, maxWords * 4) });
  return (res || '').trim().split('\n')[0];
}

async function extractAdjectivesFromReview(text) {
  const prompt = `List descriptive adjectives from the review as a JSON array. Review: "${text.replace(/"/g,'\\"')}"\nReturn only a JSON array like ["skilled","friendly"]:`;
  const res = await callOpenAI(prompt, { max_tokens: 120 });
  try { const j = JSON.parse(res); if (Array.isArray(j)) return j; } catch (e) {}
  // Fallback: try to extract comma-separated
  return (res || '').split(',').map(s=>s.trim()).filter(Boolean);
}

async function callOpenAI(prompt, opts = {}) {
  if (!OPENAI_API_KEY) throw new Error('openai_api_key_not_set');
  const model = opts.model || DEFAULT_MODEL;
  const body = { model, messages: [{ role: 'user', content: prompt }], max_tokens: opts.max_tokens || 120, temperature: opts.temperature || 0 };
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const txt = await resp.text().catch(()=>null);
    throw new Error(`openai_error:${resp.status}:${txt}`);
  }
  const j = await resp.json();
  const text = (j.choices && j.choices[0] && (j.choices[0].message && j.choices[0].message.content)) || j.choices && j.choices[0] && j.choices[0].text || '';
  return text;
}

function parseNamesFromText(s) {
  if (!s) return [];
  const t = s.trim();
  if (/^none$/i.test(t)) return [];
  return t.split(',').map(x => x.trim()).filter(Boolean).slice(0,3);
}

module.exports = { init, extractNamesFromReview, analyzeSentiment, summarizeReview, extractAdjectivesFromReview };
