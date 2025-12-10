/**
 * Enhanced review parser using local Llama (via Ollama) for NER and sentiment
 * Falls back to heuristics if Ollama unavailable
 */

const { extractNamesFromReview, analyzeSentiment, summarizeReview } = require('./ollama_client');
const { detectLanguage } = require('./language_utils');

// Rule-based pre-filter: mask PII and detect spammy content before sending to LLMs
async function tryPresidioAnalyze(text) {
  // Optional: call an external Presidio REST service if PRESIDIO_URL is set
  const PRESIDIO_URL = process.env.PRESIDIO_URL;
  if (!PRESIDIO_URL) return null;
  try {
    const res = await fetch(PRESIDIO_URL.replace(/\/$/, '') + '/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j;
  } catch (err) {
    console.warn('Presidio analyze failed:', err.message || err);
    return null;
  }
}

function maskPIIAndDetectSpam(text) {
  if (!text || typeof text !== 'string') return { cleanText: '', flags: {}, details: {} };

  const details = { emails: [], phones: [], urls: [], ssns: [], ccn: [], spamReasons: [] };
  let s = text;

  // Emails
  const emailRe = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
  s = s.replace(emailRe, (m) => { details.emails.push(m); return '[REDACTED_EMAIL]'; });

  // URLs (http(s):// or www.)
  const urlRe = /(?:https?:\/\/|www\.)\S+/gi;
  s = s.replace(urlRe, (m) => { details.urls.push(m); return '[REDACTED_URL]'; });

  // Phone numbers (various formats) - simplistic
  const phoneRe = /\b(?:\+?\d{1,3}[\s-\.]?)?(?:\(\d{2,4}\)[\s-\.]?)?\d{2,4}[\s-\.]?\d{2,4}[\s-\.]?\d{0,4}\b/g;
  s = s.replace(phoneRe, (m) => {
    // filter out short numeric tokens (years etc.)
    const digits = m.replace(/\D/g, '');
    if (digits.length >= 6 && digits.length <= 15) {
      details.phones.push(m);
      return '[REDACTED_PHONE]';
    }
    return m;
  });

  // SSN-like patterns
  const ssnRe = /\b\d{3}-\d{2}-\d{4}\b/g;
  s = s.replace(ssnRe, (m) => { details.ssns.push(m); return '[REDACTED_SSN]'; });

  // Credit-card-like sequences (13-16 digits)
  const ccRe = /\b(?:\d[ -]*?){13,16}\b/g;
  s = s.replace(ccRe, (m) => { const d = m.replace(/\D/g,''); if (d.length>=13 && d.length<=16) { details.ccn.push(m); return '[REDACTED_CC]'; } return m; });

  // Basic spam heuristics
  const spamReasons = [];
  const lower = text.toLowerCase();
  if (/\b(buy now|click here|limited time|promo code|discount|free shipping|visit .*\.com|visit .*com)\b/i.test(lower)) spamReasons.push('promotional');
  if (/https?:\/\//i.test(text) || /www\./i.test(text)) spamReasons.push('external_link');
  if (/\b(call now|text now|order now)\b/i.test(lower)) spamReasons.push('call_to_action');
  // repeated character or emoji-only
  if (/^[\s\p{So}]{1,}$/u.test(text)) spamReasons.push('emoji_or_symbols_only');
  // excessive punctuation or ALL CAPS
  if ((text.match(/[!]{3,}/g) || []).length > 0) spamReasons.push('excessive_punctuation');
  if (/[A-Z]{6,}/.test(text.replace(/[^A-Za-z]/g, ''))) spamReasons.push('all_caps');

  details.spamReasons = spamReasons;
  const flags = { exposes_pii: (details.emails.length + details.phones.length + details.ssns.length + details.ccn.length) > 0, spam: spamReasons.length > 0 };

  return { cleanText: s, flags, details };
}

/**
 * Parse a review using local LLM
 * Returns: { names, sentiment, summary }
 * 
 * @param {string} reviewText - The review text to parse
 * @param {string} shopName - Shop name to use as fallback if no barber names found
 */
async function parseReview(reviewText, shopName = null) {
  try {
    // detect language early on the original text
    const langInfo = detectLanguage(reviewText || '');
    const language = langInfo.lang === 'und' ? null : langInfo.lang;

    // Pre-filter: mask PII and detect spam before sending to LLMs
    const pre = maskPIIAndDetectSpam(reviewText || '');
    const cleaned = pre.cleanText;

    // Pass cleaned text to downstream processors; keep language hint from original
    const [names, sentiment, summary] = await Promise.all([
      extractNamesFromReview(cleaned, { language }),
      analyzeSentiment(cleaned, { language }),
      summarizeReview(cleaned, 15, { language }),
    ]);
    
    // Fallback: use shop name if no barber names found
    const finalNames = (names && names.length > 0) ? names : (shopName ? [shopName] : []);
    
    return { names: finalNames, sentiment, summary, language: language, language_confidence: langInfo.confidence, prefilter: pre, success: true };
  } catch (err) {
    console.error('Parse failed:', err.message);
    return { names: shopName ? [shopName] : [], sentiment: 0, summary: '', success: false };
  }
}

/**
 * Batch parse multiple reviews
 */
async function parseReviews(reviewTexts) {
  return Promise.all(reviewTexts.map(parseReview));
}

module.exports = {
  parseReview,
  parseReviews,
};
