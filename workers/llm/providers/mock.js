// Minimal deterministic mock provider for LLM golden-dataset testing.
module.exports = {
  async enrich(review) {
    const text = (review.text || review.body || '').toString();
    const lower = text.toLowerCase();

    // Very small heuristic-based sentiment
    let sentiment = 0.5;
    if (/\b(love|excellent|great|best|amazing|awesome|encantó)\b/.test(lower)) sentiment = 0.95;
    if (/\b(okay|fine|decent|alright|meh|decento?)\b/.test(lower)) sentiment = 0.6;
    if (/\b(bad|terrible|awful|worst|hate|peor)\b/.test(lower)) sentiment = 0.05;

    // Very small name extraction: capture capitalized single-word tokens that look like names
    const possible = (text.match(/\b[A-Z][a-z]{2,}\b/g) || []).filter(w => !['The','I','He','She','They','Best','Great'].includes(w));
    const names = [];
    if (possible.length) {
      // prefer tokens near keywords
      for (const p of possible) {
        const re = new RegExp(`\\b${p}\\b.*(barber|stylist|by|cut|gave)`, 'i');
        if (re.test(text)) { names.push(p); break; }
      }
      if (!names.length && possible.length) names.push(possible[0]);
    }

    const summary = text.length > 120 ? text.slice(0,117) + '...' : text;

    return {
      provider: 'mock',
      model: 'mock-v0',
      sentiment,
      names,
      summary,
      raw: text
    };
  }
};
