// Lightweight language detection using stopword matching.
// This is a heuristic fallback for environments without external language libs.

const STOPWORDS = {
  en: ['the','and','is','in','it','you','that','this','for','with','was','but','are','have','on','i','my'],
  es: ['el','la','y','es','en','que','para','con','por','una','un','no','me','muy','pero','tiene'],
  fr: ['le','la','et','est','en','que','pour','avec','par','une','un','pas','je','mais','sur','dans'],
  de: ['der','die','und','ist','in','das','für','mit','auf','nicht','ich','aber','ein','zu','den'],
  pt: ['o','a','e','em','que','para','com','por','uma','um','não','mas','tem','se'],
  it: ['il','la','e','è','in','che','per','con','una','un','non','ma','ho','se','si']
};

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase().replace(/[\p{P}\p{S}]/gu, ' ');
}

function countStopwords(text, stopwords) {
  let count = 0;
  for (const w of stopwords) {
    // word boundary match
    const re = new RegExp(`\\b${w}\\b`, 'g');
    const m = text.match(re);
    if (m) count += m.length;
  }
  return count;
}

/**
 * Detect probable language for a short text.
 * Returns { lang: 'en'|'es'|..., confidence: 0-1, scores: {lang:score} }
 */
function detectLanguage(text) {
  const n = normalizeText(text);
  if (!n.trim()) return { lang: 'und', confidence: 0, scores: {} };

  const scores = {};
  let total = 0;
  for (const [lang, words] of Object.entries(STOPWORDS)) {
    const c = countStopwords(n, words);
    scores[lang] = c;
    total += c;
  }

  // If no stopwords matched, fallback to basic heuristics
  if (total === 0) {
    // detect presence of accented characters or common language-specific characters
    if (/\p{Script=Latin}/u.test(text)) {
      // check for French-specific accents first
      if (/[àâäçéèêëîïôöùûü]/i.test(text)) return { lang: 'fr', confidence: 0.6, scores };
      // then Spanish characters
      if (/[ñáéíóúü]/i.test(text)) return { lang: 'es', confidence: 0.6, scores };
    }
    return { lang: 'und', confidence: 0.15, scores };
  }

  // pick best language
  let best = null;
  for (const [lang, s] of Object.entries(scores)) {
    if (best === null || s > scores[best]) best = lang;
  }

  // confidence = best_score / total, scaled between 0 and 1
  const confidence = total > 0 ? Math.min(1, scores[best] / total) : 0;
  return { lang: best, confidence: Number(confidence.toFixed(2)), scores };
}

module.exports = { detectLanguage };
