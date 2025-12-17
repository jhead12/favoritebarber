#!/usr/bin/env node
// Robust Playwright Bing-based social profile searcher
// Features:
// - Uses Bing search results for queries
// - Filters social-domain links and visits pages
// - Saves HTML snapshots and screenshots for evidence
// - Extracts handles via URL patterns and common meta selectors
// - Safer throttling (delays, low concurrency)

const fs = require('fs');
const os = require('os');
const path = require('path');

let playwright;
try {
  playwright = require('playwright');
} catch (e) {
  console.error('Playwright not installed. Run `npm install playwright` and `npx playwright install`');
  throw e;
}
const { chromium } = playwright;

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

const SNAPSHOT_DIR = process.env.RYB_SNAPSHOT_DIR || path.join(os.tmpdir(), 'ryb-social-snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function bingSearchPageLinks(query, page) {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  // b_algo is the standard result block on Bing
  const links = await page.$$eval('li.b_algo h2 a', anchors => anchors.map(a => a.href));
  return links.filter(Boolean);
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

function extractHandleFromUrl(u) {
  try {
    const p = new URL(u);
    const host = p.hostname.toLowerCase();
    const pathname = p.pathname.replace(/\/+$/, '');
    // instagram.com/username or instagram.com/username/
    if (host.includes('instagram.com')) {
      const m = pathname.match(/^\/(?:p|explore|stories)\//) ? null : pathname.match(/^\/?@?([A-Za-z0-9_.]+)/);
      if (m) return m[1];
    }
    // tiktok.com/@username
    if (host.includes('tiktok.com')) {
      const m = pathname.match(/^\/@([A-Za-z0-9_.]+)/);
      if (m) return m[1];
    }
    // twitter/x: /username or /i/...
    if (host.includes('twitter.com') || host.includes('x.com')) {
      const m = pathname.match(/^\/?@?([A-Za-z0-9_]+)/);
      if (m) return m[1];
    }
    // facebook: /profile.php?id= or /username
    if (host.includes('facebook.com') || host.includes('m.facebook.com')) {
      const qp = p.searchParams.get('id');
      if (qp) return qp;
      const m = pathname.match(/^\/?([A-Za-z0-9.]+)/);
      if (m) return m[1];
    }
    // linkedin: /in/username
    if (host.includes('linkedin.com')) {
      const m = pathname.match(/\/in\/(.+)$/);
      if (m) return m[1].replace(/\/.+$/, '');
    }
    return null;
  } catch (e) {
    return null;
  }
}

async function extractFromPage(page, url) {
  const out = { handles: [], urls: [url], meta: {} };
  try {
    // attempt to read common meta tags
    const meta = {};
    try { meta.ogTitle = await page.$eval('meta[property="og:title"]', n => n.content); } catch (e) {}
    try { meta.ogUrl = await page.$eval('meta[property="og:url"]', n => n.content); } catch (e) {}
    try { meta.twitterTitle = await page.$eval('meta[name="twitter:title"]', n => n.content); } catch (e) {}
    try { meta.description = await page.$eval('meta[name="description"]', n => n.content); } catch (e) {}
    out.meta = meta;

    // heuristics: look for visible username patterns on profile pages
    const text = await page.$$eval('h1, h2, h3, title, header, .profile, .bio, [data-testid] ', nodes => nodes.map(n => n.innerText || n.textContent).join('\n'));
    const handleMatch = text.match(/@([A-Za-z0-9_.]{3,40})/);
    if (handleMatch) out.handles.push(handleMatch[1]);

    // parse canonical link
    try {
      const canonical = await page.$eval('link[rel="canonical"]', n => n.href);
      if (canonical) out.urls.unshift(canonical);
    } catch (e) {}
  } catch (e) {
    // ignore page extraction failure
  }
  return out;
}

async function processSocialUrl(browser, url, opts) {
  const page = await browser.newPage();
  try {
    // basic navigation and evidence capture
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const safeHost = url.replace(/[^A-Za-z0-9]/g, '_').slice(0,80);
    const htmlPath = path.join(SNAPSHOT_DIR, `${id}-${safeHost}.html`);
    const imgPath = path.join(SNAPSHOT_DIR, `${id}-${safeHost}.png`);
    try {
      const html = await page.content();
      fs.writeFileSync(htmlPath, html, 'utf8');
    } catch (e) {
      console.warn('Could not save HTML snapshot for', url, e.message || e);
    }
    try { await page.screenshot({ path: imgPath, fullPage: true, timeout: 30_000 }); } catch (e) {}

    const extracted = await extractFromPage(page, url);
    // also extract handle from url path
    const urlHandle = extractHandleFromUrl(url);
    if (urlHandle && !extracted.handles.includes(urlHandle)) extracted.handles.unshift(urlHandle);
    return { url, extracted, htmlPath, imgPath };
  } catch (e) {
    console.warn('Error processing social url', url, e.message || e);
    return { url, extracted: { handles: [], urls: [url] }, htmlPath: null, imgPath: null };
  } finally {
    try { await page.close(); } catch (e) {}
  }
}

async function searchSocialProfilesBing({ name, location = '', queries = null, maxResultsPerQuery = 8, minDelayMs = 800, maxDelayMs = 2200, dryRun = false } = {}) {
  if (!name) throw new Error('name is required');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const qlist = queries || [
      `${name} ${location} instagram`,
      `${name} ${location} tiktok`,
      `${name} ${location} facebook`,
      `${name} ${location} linkedin`,
      `${name} ${location} youtube`,
    ];

    const seen = new Set();
    const persisted = [];

    for (const q of qlist) {
      console.log('Bing search:', q);
      let links = [];
      try { links = await bingSearchPageLinks(q, page); } catch (e) { console.warn('Bing query failed', q, e.message || e); continue; }
      const social = filterSocialLinks(links).slice(0, maxResultsPerQuery);
      for (const s of social) {
        if (seen.has(s)) continue;
        seen.add(s);
        // throttle between visits
        const delayMs = Math.floor(minDelayMs + Math.random() * (maxDelayMs - minDelayMs));
        await delay(delayMs);
        const processed = await processSocialUrl(browser, s, {});

        const handles = processed.extracted.handles || [];
        const urls = processed.extracted.urls || [s];
        const candidate = { source_record: { query: q }, handles, urls, name };

        let verification = { heuristic: null, llm: null };
        try { verification = await verifyCandidate(candidate); } catch (e) { console.warn('verifyCandidate error', e.message || e); }

        // choose platform/handle/profile_url
        let platform = null;
        let handle = handles.length ? handles[0] : null;
        let profile_url = urls[0];
        if (verification && verification.heuristic && verification.heuristic.evidence && verification.heuristic.evidence.length) {
          const lead = verification.heuristic.evidence[0];
          platform = lead.platform || platform;
          profile_url = lead.url || profile_url;
        }
        if (verification && verification.llm && verification.llm.handle) {
          handle = verification.llm.handle;
          platform = verification.llm.platform || platform;
        }

        const evidence = { searchQuery: q, found_url: s, snapshot_html: processed.htmlPath, snapshot_img: processed.imgPath, verification };

        try {
          if (dryRun) {
            // return candidate object without persisting
            persisted.push({ s, candidate: { platform, handle, profile_url, name, evidence, confidence: (verification && verification.heuristic && verification.heuristic.confidence) || 0, source: 'bing_searcher' } });
            console.log('Dry-run: found candidate for', s);
          } else {
            const created = await createCandidate({ platform, handle, profile_url, name, evidence, confidence: (verification && verification.heuristic && verification.heuristic.confidence) || 0, source: 'bing_searcher' });
            persisted.push({ s, created });
            console.log('Persisted:', s, 'id=', created && created.id);
          }
        } catch (e) {
          console.warn('createCandidate failed', e.message || e);
        }
      }
    }
    try { await page.close(); } catch (e) {}
    return persisted;
  } finally {
    await browser.close();
  }
}

module.exports = { searchSocialProfilesBing };

// CLI
if (require.main === module) {
  (async () => {
    // Usage: node social_searcher_bing.js "Shop Name" "Location/address" [--dry-run] [--maxResults=6]
    const argv = process.argv.slice(2);
    const flags = argv.filter(a => a.startsWith('--'));
    const args = argv.filter(a => !a.startsWith('--'));
    const name = args[0];
    const location = args[1] || '';
    if (!name) {
      console.log('Usage: node workers/crawlers/social_searcher_bing.js "Barber Name" "City, ST" [--dry-run] [--maxResults=N]');
      process.exit(2);
    }
    const dryRun = flags.includes('--dry-run') || flags.includes('--dryrun');
    let maxResults = 8;
    for (const f of flags) {
      if (f.startsWith('--maxResults=')) {
        const v = parseInt(f.split('=')[1], 10);
        if (!isNaN(v)) maxResults = v;
      }
    }
    try {
      const res = await searchSocialProfilesBing({ name, location, maxResultsPerQuery: maxResults, dryRun });
      console.log('Done. candidates:', res.length);
      // pretty-print a bit more in dry-run mode
      if (dryRun) {
        res.forEach((r, i) => {
          const c = r.candidate || r.created || {};
          console.log(`${i+1}. ${r.s} -> handle=${c.handle || '(n/a)'} platform=${c.platform || '(n/a)'} profile_url=${c.profile_url || '(n/a)'} evidence_keys=${c.evidence ? Object.keys(c.evidence).join(',') : 'none'}`);
        });
      }
      process.exit(0);
    } catch (e) {
      console.error('Error', e.message || e);
      process.exit(1);
    }
  })();
}
