// Minimal deterministic mock provider for LLM golden-dataset testing.
module.exports = {
  async init() {
    // No-op for mock
  },

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
  },

  async extractNamesFromReview(text) {
    const possible = (text.match(/\b[A-Z][a-z]{2,}\b/g) || []).filter(w => !['The','I','He','She','They','Best','Great'].includes(w));
    return possible.slice(0, 3);
  },

  async analyzeSentiment(text) {
    const lower = text.toLowerCase();
    if (/\b(love|excellent|great|best|amazing|awesome)\b/.test(lower)) return 1;
    if (/\b(bad|terrible|awful|worst|hate)\b/.test(lower)) return -1;
    return 0;
  },

  async summarizeReview(payload) {
    const text = typeof payload === 'string' ? payload : payload.text;
    const maxWords = typeof payload === 'string' ? 20 : (payload.maxWords || 20);
    const words = text.split(' ').slice(0, maxWords);
    return words.join(' ') + (text.split(' ').length > maxWords ? '…' : '');
  },

  async extractAdjectivesFromReview(text) {
    const lexicon = ['amazing','excellent','great','perfect','fantastic','skilled','bad','terrible','awful'];
    const found = new Set();
    const lower = (text || '').toLowerCase();
    for (const adj of lexicon) {
      if (lower.includes(adj)) found.add(adj);
    }
    return Array.from(found);
  },

  /**
   * Generic call method for moderation and other tasks
   * Returns mock JSON responses for common moderation patterns
   */
  async call(prompt, options = {}) {
    // Extract review text from prompt
    const reviewMatch = prompt.match(/Review(?:\s+Text)?:\s*"([^"]+)"/);
    const reviewText = reviewMatch ? reviewMatch[1] : '';
    
    // Mock moderation logic
    const lower = reviewText.toLowerCase();
    
    // Spam detection
    const hasSpamKeywords = /buy now|click here|visit|promo code|discount|special offer|limited time|http|\.com|www\.|call \d/i.test(reviewText);
    
    // Fake detection (too short, generic)
    const isTooShort = reviewText.trim().length < 15;
    const isGeneric = /^(great|good|best|awesome|terrible|worst|bad)\s*(barber|shop|place|service)/i.test(reviewText);
    const isFake = isTooShort || isGeneric;
    
    // Attack detection (all caps, excessive exclamation)
    const isAllCaps = reviewText === reviewText.toUpperCase() && reviewText.length > 20;
    const excessiveExclamation = (reviewText.match(/!/g) || []).length > 5;
    const isAttack = isAllCaps || excessiveExclamation;
    
    // Inappropriate detection (profanity, harassment)
    const profanity = /fuck|shit|bitch|asshole|bastard|idiot|scammer/i;
    const threats = /shut down|avoid at all costs|never go|waste/i;
    const isInappropriate = profanity.test(reviewText) && threats.test(reviewText);
    
    // Build response
    const result = {
      is_spam: hasSpamKeywords,
      is_fake: isFake,
      is_attack: isAttack,
      is_inappropriate: isInappropriate,
      confidence: 0.85,
      reason: []
    };
    
    if (result.is_spam) result.reason.push('promotional content detected');
    if (result.is_fake) result.reason.push('generic or short review');
    if (result.is_attack) result.reason.push('aggressive tone');
    if (result.is_inappropriate) result.reason.push('inappropriate language');
    if (result.reason.length === 0) result.reason.push('clean review');
    
    result.reason = result.reason.join(', ');
    
    return JSON.stringify(result);
  }
};
