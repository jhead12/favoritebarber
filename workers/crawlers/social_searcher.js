#!/usr/bin/env node
// Lightweight Playwright-based social profile searcher (scaffold)
// - Searches for social links for a given name+location using a search engine
// - Extracts candidate social URLs/handles
// - Calls verifyCandidate() and persists winners with createCandidate()

const { chromium } = (() => {
  try {
    return require('playwright');
  } catch (e) {
    // Helpful error when Playwright isn't installed
    console.error('Playwright not installed. Run `npm install -D playwright` or `npm install playwright`');
    throw e;
  }
})();

const { verifyCandidate } = require('../../api/lib/llmVerifier');
const { createCandidate } = require('../../api/models/socialProfile');
const { extractHandlesAndUrls } = require('../../api/lib/ingestUpload');

const socialDomains = [
  'instagram.com',
  'facebook.com',
  'm.facebook.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'linkedin.com'
];

async function runQueryGetLinks(query, browser) {
  const page = await browser.newPage();
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}`;
  await page.goto(searchUrl, { waitUntil: 'networkidle' });
  // collect anchors on the page
  const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText || a.textContent || '' })));
  await page.close();
  return anchors.map(a => a.href).filter(Boolean);
}

function filterSocialLinks(links) {
  const unique = Array.from(new Set(links));
  return unique.filter(u => {
    try {
      const p = new URL(u);
      return socialDomains.some(d => p.hostname.toLowerCase().includes(d));
    } catch (e) {
      return false;
    }
  });
}

async function searchSocialProfiles({ name, location = '', queries = null, maxPerQuery = 10 } = {}) {
  if (!name) throw new Error('name is required');
  const browser = await chromium.chromium.launch ? await chromium.chromium.launch({ headless: true }) : await chromium.launch({ headless: true });
  try {
    const qlist = queries || [
      `${name} ${location} instagram`,
      `${name} ${location} tiktok`,
      `${name} ${location} facebook`,
      `${name} ${location} linkedin`
    ];

    const seen = new Set();
    const results = [];

    for (const q of qlist) {
      console.log('Searching:', q);
      let links = [];
      try {
        links = await runQueryGetLinks(q, browser);
      } catch (e) {
        console.warn('query failed', q, e.message || e);
        continue;
      }
      const social = filterSocialLinks(links).slice(0, maxPerQuery);
      for (const url of social) {
        if (seen.has(url)) continue;
        seen.add(url);
        // extract handles/urls heuristically
        const { handles, urls } = extractHandlesAndUrls(url);
        const candidate = { source_record: { query: q }, handles: handles || [], urls: urls.length ? urls : [url], name };
        // run verification using existing heuristics/LLM
        let verification = { heuristic: null, llm: null };
        try {
          verification = await verifyCandidate(candidate);
        } catch (e) {
          console.warn('verifyCandidate failed for', url, e.message || e);
        }

        // prefer platform/handle/url choices from verification where possible
        let platform = null;
        let handle = handles && handles.length ? handles[0] : null;
        let profile_url = url;
        if (verification && verification.heuristic && verification.heuristic.evidence && verification.heuristic.evidence.length) {
          const lead = verification.heuristic.evidence[0];
          platform = lead.platform || platform;
          profile_url = lead.url || profile_url;
        }
        if (verification && verification.llm && verification.llm.handle) {
          handle = verification.llm.handle;
          platform = verification.llm.platform || platform;
        }

        const evidence = { searchQuery: q, found_url: url, verification };

        try {
          const created = await createCandidate({ platform, handle, profile_url, name, evidence, confidence: (verification && verification.heuristic && verification.heuristic.confidence) || 0, source: 'searcher' });
          results.push({ url, candidate, verification, created });
          console.log('Persisted candidate for', url, 'id=', created && created.id);
        } catch (e) {
          console.warn('createCandidate failed for', url, e.message || e);
        }
      }
    }
    return results;
  } finally {
    await browser.close();
  }
}

module.exports = { searchSocialProfiles };

// CLI entry
if (require.main === module) {
  (async () => {
    const name = process.argv[2];
    const location = process.argv[3] || '';
    if (!name) {
      console.log('Usage: node workers/crawlers/social_searcher.js "Barber Name" "City, ST"');
      process.exit(2);
    }
    try {
      const res = await searchSocialProfiles({ name, location });
      console.log('Done. Candidates found:', res.length);
      process.exit(0);
    } catch (e) {
      console.error('Error running searcher', e.message || e);
      process.exit(1);
    }
  })();
}
