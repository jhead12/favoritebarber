const fetch = global.fetch || require('node-fetch');
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY || null;
const DEFAULT_MODEL = process.env.REPLICATE_MODEL || 'gpt-4o-realtime-preview';

async function init() { if (!REPLICATE_API_KEY) return; }

async function callReplicate(prompt) {
  if (!REPLICATE_API_KEY) throw new Error('no_replicate_api_key');
  // Minimal call skeleton; users should replace with official replicate client for production
  const res = await fetch('https://api.replicate.com/v1/predictions', {
    method: 'POST',
    headers: { 'Authorization': `Token ${REPLICATE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ version: DEFAULT_MODEL, input: { prompt } })
  });
  if (!res.ok) throw new Error('replicate_call_failed:' + res.status);
  const body = await res.json();
  // prediction may be asynchronous; if output present, return joined text
  if (body && body.output) return Array.isArray(body.output) ? body.output.join('\n') : String(body.output);
  return JSON.stringify(body);
}

module.exports = {
  init,
  async extractNamesFromReview(text, opts = {}) {
    try {
      const prompt = `Extract person names mentioned in the review as a comma-separated list:\n\n${text}`;
      const out = await callReplicate(prompt);
      return (''+out).split(/[,\n]/).map(s=>s.trim()).filter(Boolean);
    } catch (e) { return []; }
  },
  async analyzeSentiment(text, opts = {}) {
    try {
      const prompt = `Rate sentiment on scale -2 to 2 as a single integer for the review:\n\n${text}`;
      const out = await callReplicate(prompt);
      const n = parseInt((''+out).trim(),10);
      return Number.isFinite(n) ? n : 0;
    } catch (e) { return 0; }
  },
  async summarizeReview(text, maxWords = 20, opts = {}) {
    try {
      const prompt = `Summarize in ${maxWords} words or less:\n\n${text}`;
      const out = await callReplicate(prompt);
      return (''+out).trim();
    } catch (e) { return (text||'').split(' ').slice(0,maxWords).join(' '); }
  },
  async extractAdjectivesFromReview(text, opts = {}) {
    try {
      const prompt = `List descriptive adjectives from the review as comma-separated values:\n\n${text}`;
      const out = await callReplicate(prompt);
      return (''+out).split(/[,\n]/).map(s=>s.trim().toLowerCase()).filter(Boolean);
    } catch (e) { return []; }
  }
};
