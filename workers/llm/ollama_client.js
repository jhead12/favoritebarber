/**
 * Ollama/Llama client for local LLM inference
 * Falls back to heuristics if Ollama is unavailable
 */

const OLLAMA_ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

let ollamaAvailable = false;

// Check if Ollama is reachable
async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/tags`);
    ollamaAvailable = res.ok;
    const message = ollamaAvailable ? `Ollama is reachable at ${OLLAMA_ENDPOINT}` : `Ollama responded but returned HTTP ${res.status}`;
    if (ollamaAvailable) console.log('✓', message);
    else console.warn('⚠', message);
    return { available: !!ollamaAvailable, message };
  } catch (e) {
    const message = 'Ollama not available; will use fallback heuristics';
    console.warn('⚠', message, e.message || e);
    ollamaAvailable = false;
    return { available: false, message };
  }
}

/**
 * Call Ollama with a prompt, return raw text response
 */
async function callOllama(prompt, system = null) {
  if (!ollamaAvailable) throw new Error('Ollama not available');
  try {
    const res = await fetch(`${OLLAMA_ENDPOINT}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt,
        system,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
    const data = await res.json();
    return data.response || '';
  } catch (err) {
    console.error('Ollama call failed:', err.message);
    throw err;
  }
}

/**
 * Extract likely barber names from review text using Ollama
 * Prompt-based NER (Named Entity Recognition) with optimized prompt for accuracy
 */
async function extractNamesFromReview(reviewText) {
  // Enhanced heuristic patterns for fallback (when Ollama unavailable)
  function heuristicExtract() {
    const candidates = new Set();
    
    // Pattern 1: "John gave me", "Sarah did", "Marcus cut"
    const pattern1 = /(?:^|\W)([A-Z][a-z]{1,20})\s+(?:gave|cut|did|nailed|worked|styled|trimmed|finished|created|delivered|did\s+my)\b/i;
    const match1 = pattern1.exec(reviewText);
    if (match1?.[1]) candidates.add(match1[1]);
    
    // Pattern 2: "by John", "by Sarah"
    const pattern2 = /\bby\s+([A-Z][a-z]{1,20})\b/i;
    const match2 = pattern2.exec(reviewText);
    if (match2?.[1]) candidates.add(match2[1]);
    
    // Pattern 3: "with John at", "worked with Maria"
    const pattern3 = /(?:with|to|from|saw)\s+([A-Z][a-z]{1,20})\s+(?:at|and|is|was|does)/i;
    const match3 = pattern3.exec(reviewText);
    if (match3?.[1]) candidates.add(match3[1]);
    
    // Pattern 4: "John is a", "Maria was", "Tony's amazing"
    const pattern4 = /([A-Z][a-z]{1,20})'?s?\s+(?:is|was|are|were|does|has)\s+(?:a\s+)?(?:barber|stylist|amazing|excellent|talented|professional|skilled)/i;
    const match4 = pattern4.exec(reviewText);
    if (match4?.[1]) candidates.add(match4[1]);
    
    // Pattern 5: "The barber John", "My barber Sarah"
    const pattern5 = /(?:the|my|our)\s+barber\s+([A-Z][a-z]{1,20})/i;
    const match5 = pattern5.exec(reviewText);
    if (match5?.[1]) candidates.add(match5[1]);
    
    // Pattern 6: "asked for John", "requested Sarah"
    const pattern6 = /(?:asked for|requested|wanted|got|saw)\s+([A-Z][a-z]{1,20})/i;
    const match6 = pattern6.exec(reviewText);
    if (match6?.[1]) candidates.add(match6[1]);
    
    return Array.from(candidates).filter(n => n.length > 1 && n.length < 30);
  }

  if (!ollamaAvailable) {
    return heuristicExtract();
  }

  try {
    // Optimized prompt for better name extraction
    const prompt = `You are a Named Entity Recognition (NER) expert specialized in barbershop reviews. Extract ONLY personal first/last names of barbers, stylists, or staff mentioned in the review.

CRITICAL RULES:
1. Extract ONLY real person names (John, Sarah, Mike, Tony, Marcus, etc.)
2. Exclude: articles (the, was, am, is), common words, shop names, locations
3. Return as comma-separated list: John, Sarah, Mike
4. If NO person names found, respond with exactly: NONE
5. Maximum 3 names per review

Review: "${reviewText}"

Person names found:`;

    const response = await callOllama(prompt, 'You are an expert at extracting only personal names (first and last names) of people. Ignore articles, verbs, and shop names.');
    
    // Parse the response more carefully
    let names = response
      .trim()
      .split(',')
      .map((n) => n.trim())
      .filter((n) => {
        if (!n || n === 'NONE' || n.toLowerCase() === 'none') return false;
        if (n.length < 2 || n.length > 50) return false;
        // Check if it looks like a real name (starts with capital letter)
        if (!/^[A-Z]/.test(n)) return false;
        // Exclude common articles and verbs that sometimes appear
        if (/^(The|Was|Is|Am|Are|Were|Been|Has|Have|Did|Do|Does|And|Or|But|At|In|On|By|To|From|With|As|For|Of|A|An|It|They|She|He)$/i.test(n)) {
          return false;
        }
        return true;
      });
    
    // If LLM extraction found names, return them; otherwise fall back to heuristics
    return names.length > 0 ? names : heuristicExtract();
  } catch (err) {
    console.error('Name extraction failed, falling back to heuristics:', err.message);
    return heuristicExtract();
  }
}

/**
 * Estimate sentiment (-1 to +1) using Ollama
 * Enhanced to handle mixed and neutral sentiment correctly
 */
async function analyzeSentiment(reviewText) {
  if (!ollamaAvailable) {
    // Heuristic fallback: improved logic for mixed sentiment
    const positive = /amazing|excellent|great|love|perfect|fantastic|brilliant|wonderful|best|impressed|highly recommend|very satisfied/i;
    const negative = /awful|terrible|bad|horrible|poor|worst|dissatisfied|disappointed|waste|not recommend|never again|waste of money/i;
    const mixed = /decent|okay|average|fine|alright|could be better|pretty good|good but|not bad|acceptable/i;
    
    const positiveCount = (reviewText.match(/amazing|excellent|great|love|perfect/gi) || []).length;
    const negativeCount = (reviewText.match(/awful|terrible|bad|horrible|poor|worst/gi) || []).length;
    
    if (positiveCount > negativeCount + 1) return 1;
    if (negativeCount > positiveCount + 1) return -1;
    if (mixed.test(reviewText)) return 0;
    if (positiveCount > 0) return 1;
    if (negativeCount > 0) return -1;
    return 0;
  }

  try {
    const prompt = `Analyze the sentiment of this barbershop review. Consider the overall tone carefully.

INSTRUCTIONS:
- For reviews with BOTH positive and negative elements, identify which dominates
- "Decent haircut but bad service" = balance of factors, likely NEUTRAL (0)
- "Great cut, mediocre service" = good outweighs mediocre, likely POSITIVE (1)
- "Okay haircut, awful attitude" = bad outweighs okay, likely NEGATIVE (-1)
- Pure positive (excellent, amazing, love, highly recommend) = POSITIVE (1)
- Pure negative (terrible, awful, horrible, waste, never again) = NEGATIVE (-1)
- Mixed/undecided (decent, okay, average, not sure) = NEUTRAL (0)

Review: "${reviewText}"

Respond with ONLY one number: -1 (negative), 0 (neutral), or 1 (positive)`;

    const response = await callOllama(
      prompt,
      'You are an expert at analyzing sentiment in customer reviews. Respond with only: -1, 0, or 1'
    );
    
    const sentiment = parseInt(response.trim(), 10);
    if (sentiment === -1 || sentiment === 0 || sentiment === 1) {
      return sentiment;
    }
    
    // Fallback if response wasn't a clean number
    if (response.includes('-1') || response.toLowerCase().includes('negative')) return -1;
    if (response.includes('1') || response.toLowerCase().includes('positive')) return 1;
    return 0;
  } catch (err) {
    console.error('Sentiment analysis failed, falling back to heuristics:', err.message);
    // Heuristic fallback
    const positive = /amazing|excellent|great|love|perfect|fantastic|brilliant|wonderful|best|impressed|highly recommend|very satisfied/i;
    const negative = /awful|terrible|bad|horrible|poor|worst|dissatisfied|disappointed|waste|not recommend|never again|waste of money/i;
    const mixed = /decent|okay|average|fine|alright|could be better|pretty good|good but|not bad|acceptable/i;
    
    if (positive.test(reviewText) && !negative.test(reviewText)) return 1;
    if (negative.test(reviewText) && !positive.test(reviewText)) return -1;
    if (mixed.test(reviewText)) return 0;
    return 0;
  }
}

/**
 * Summarize review using Ollama
 */
async function summarizeReview(reviewText, maxWords = 20) {
  if (!ollamaAvailable) {
    // Simple truncation fallback
    const words = reviewText.split(' ');
    return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '…' : '');
  }

  try {
    const prompt = `Summarize this barbershop review in ${maxWords} words or fewer.\n\nReview: "${reviewText}"`;
    const response = await callOllama(prompt, 'You are a concise summarization assistant.');
    return response.trim().slice(0, maxWords * 10);
  } catch (err) {
    console.error('Summarization failed, falling back:', err.message);
    // Retry heuristic fallback
    const words = reviewText.split(' ');
    return words.slice(0, maxWords).join(' ') + (words.length > maxWords ? '…' : '');
  }
}

/**
 * Extract adjectives that describe the barber/service from the review.
 * Uses Ollama if available; otherwise falls back to a small adjective lexicon scan.
 * Returns an array of lowercase adjective strings (unique).
 */
async function extractAdjectivesFromReview(reviewText) {
  if (!ollamaAvailable) {
    // Simple lexicon-based fallback
    const lexicon = ['amazing','excellent','great','perfect','fantastic','skilled','talented','professional','clean','friendly','rude','bad','terrible','awful','mediocre','decent','ok','okay','fast','slow','expensive','cheap','affordable','patient','careful','quick','precise','crisp','detailed'];
    const found = new Set();
    const lower = (reviewText || '').toLowerCase();
    for (const adj of lexicon) if (lower.includes(adj)) found.add(adj);
    return Array.from(found);
  }

  try {
    const prompt = `Extract descriptive adjectives from this barbershop review. Return a JSON array of short adjective strings (no punctuation). Example: ["skilled","friendly","quick"]. Only include adjectives that describe the barber, haircut, service, or shop.

Review:\n"${reviewText}"

Return only the JSON array.`;

    const resp = await callOllama(prompt, 'You are a concise extractor that returns only a JSON array of adjectives.');
    // try to parse JSON from response
    const j = resp.trim();
    let arr = [];
    try { arr = JSON.parse(j); } catch (e) {
      // fallback: extract words between [ ] if possible
      const m = j.match(/\[.*\]/s);
      if (m) {
        try { arr = JSON.parse(m[0]); } catch (ee) { arr = []; }
      }
    }
    if (!Array.isArray(arr)) arr = [];
    // normalize
    const normalized = Array.from(new Set(arr.map(a => (''+a).toLowerCase().trim()).filter(Boolean)));
    return normalized;
  } catch (err) {
    console.error('Adjective extraction failed, falling back to lexicon:', err.message || err);
    // fallback lexicon
    const lexicon = ['amazing','excellent','great','perfect','fantastic','skilled','talented','professional','clean','friendly','rude','bad','terrible','awful','mediocre','decent','ok','okay','fast','slow','expensive','cheap','affordable','patient','careful','quick','precise','crisp','detailed'];
    const found = new Set();
    const lower = (reviewText || '').toLowerCase();
    for (const adj of lexicon) if (lower.includes(adj)) found.add(adj);
    return Array.from(found);
  }
}

/**
 * Generic call method for arbitrary prompts
 * Used by moderator, trust scorer, and other advanced use cases
 * 
 * @param {string} prompt - The prompt text
 * @param {Object} options - { system, temperature, ... } (system message for context)
 * @returns {Promise<string>} LLM response text
 */
async function call(prompt, options = {}) {
  return callOllama(prompt, options.system || null);
}

module.exports = {
  checkOllama,
  callOllama,
  extractNamesFromReview,
  analyzeSentiment,
  summarizeReview,
  extractAdjectivesFromReview,
  call
};

