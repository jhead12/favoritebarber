const axios = require('axios');
const url = require('url');

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || null;
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || null;

async function heuristicCheck(candidate) {
  // candidate: {handles, urls, name, source_record}
  const evidence = [];
  for (const u of candidate.urls || []) {
    try {
      const parsed = new URL(u);
      const host = parsed.hostname.toLowerCase();
      if (host.includes('instagram.com')) {
        evidence.push({ url: u, platform: 'instagram', confidence: 0.9 });
      } else if (host.includes('facebook.com') || host.includes('m.facebook.com')) {
        evidence.push({ url: u, platform: 'facebook', confidence: 0.85 });
      } else if (host.includes('tiktok.com')) {
        evidence.push({ url: u, platform: 'tiktok', confidence: 0.85 });
      } else {
        evidence.push({ url: u, platform: 'unknown', confidence: 0.4 });
      }
    } catch (e) {
      evidence.push({ url: u, platform: 'unknown', confidence: 0.2 });
    }
  }
  // handles: if they look like instagram handles assume platform instagram
  for (const h of candidate.handles || []) {
    evidence.push({ handle: h, platform: 'instagram', confidence: 0.6 });
  }
  // if name includes Shop or Barber words, bump a bit
  if (candidate.name && /shop|barber|barbershop/i.test(candidate.name)) {
    evidence.push({ note: 'name_hints_shop', confidence: 0.15 });
  }
  // combine to an overall confidence (cap 0.99)
  const score = Math.min(0.99, evidence.reduce((s, e) => s + (e.confidence || 0), 0));
  return { evidence, confidence: score };
}

async function ollamaCheck(candidate) {
  if (!OLLAMA_ENDPOINT || !OLLAMA_MODEL) return null;
  try {
    const prompt = `You are given a URL and/or handles extracted from a data dump. Return a compact JSON with fields: platform (instagram/facebook/tiktok/other), handle (if found), is_profile (true/false), reason (short). Input: ${JSON.stringify(candidate)}`;
    const res = await axios.post(`${OLLAMA_ENDPOINT}/v1/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      max_tokens: 200
    }, { timeout: 20_000 });
    // best-effort parse
    const txt = res.data?.result || res.data?.output || JSON.stringify(res.data);
    try {
      const parsed = JSON.parse(txt);
      return parsed;
    } catch (e) {
      return { raw: txt };
    }
  } catch (e) {
    console.warn('ollamaCheck failed', e.message || e);
    return null;
  }
}

async function verifyCandidate(candidate) {
  // run heuristic
  const heuristic = await heuristicCheck(candidate);
  // try LLM if configured
  const llm = await ollamaCheck(candidate);
  return { heuristic, llm };
}

module.exports = { verifyCandidate };
