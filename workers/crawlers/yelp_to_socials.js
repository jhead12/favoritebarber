#!/usr/bin/env node
// Find social links from a Yelp business page, then visit the business website(s)
// and extract social profiles associated with the shop/barbers.

const fs = require('fs');
const path = require('path');
const os = require('os');
// load environment from .env when run as a script
try { require('dotenv').config(); } catch (e) {}
let playwright;
try { playwright = require('playwright'); } catch (e) { console.error('Playwright not installed. Run `npm install playwright` and `npx playwright install`'); throw e; }
const { chromium } = playwright;
const { verifyCandidate } = require('../../api/lib/llmVerifier');
const { createCandidate } = require('../../api/models/socialProfile');
const { pool } = require('../../api/db');

const SNAPSHOT_DIR = process.env.RYB_SNAPSHOT_DIR || path.join(os.tmpdir(), 'ryb-yelp-snapshots');
if (!fs.existsSync(SNAPSHOT_DIR)) fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

const fetch = global.fetch || require('node-fetch');
const YELP_KEY = process.env.YELP_API_KEY || null;

async function yelpSearchByName(name, location) {
  if (!YELP_KEY) throw new Error('YELP_API_KEY not set in env');
  const res = await fetch(`https://api.yelp.com/v3/businesses/search?term=${encodeURIComponent(name)}&location=${encodeURIComponent(location || '')}&limit=3`, { headers: { Authorization: `Bearer ${YELP_KEY}` } });
  if (!res.ok) throw new Error(`Yelp search failed ${res.status}`);
  return res.json();
}

async function yelpGetBusiness(id) {
  if (!YELP_KEY) throw new Error('YELP_API_KEY not set in env');
  const res = await fetch(`https://api.yelp.com/v3/businesses/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${YELP_KEY}` } });
  if (!res.ok) throw new Error(`Yelp business fetch failed ${res.status}`);
  return res.json();
}

function filterExternalLinks(links) {
  const unique = Array.from(new Set(links));
  return unique.filter(u => {
    try { const p = new URL(u); return p.hostname && !p.hostname.toLowerCase().includes('yelp.com'); } catch (e) { return false; }
  });
}

async function scrapeYelpForExternal(yelpUrl, browser) {
  const page = await browser.newPage();
  try {
    await page.goto(yelpUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    // gather anchors
    const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText || a.textContent || '' })));
    const hrefs = anchors.map(a => a.href).filter(Boolean);
    const external = filterExternalLinks(hrefs);
    return external;
  } finally {
    try { await page.close(); } catch (e) {}
  }
}

async function visitAndExtract(targetUrl, browser) {
  const page = await browser.newPage();
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const safe = targetUrl.replace(/[^A-Za-z0-9]/g, '_').slice(0,100);
    const htmlPath = path.join(SNAPSHOT_DIR, `${id}-${safe}.html`);
    const imgPath = path.join(SNAPSHOT_DIR, `${id}-${safe}.png`);
    try { fs.writeFileSync(htmlPath, await page.content(), 'utf8'); } catch (e) {}
    try { await page.screenshot({ path: imgPath, fullPage: true, timeout: 30_000 }); } catch (e) {}

    // basic extractors
    const anchors = await page.$$eval('a', as => as.map(a => ({ href: a.href, text: a.innerText || a.textContent || '' })));
    const hrefs = anchors.map(a => a.href).filter(Boolean);
    // find social links by domain (prioritize known social platforms)
    const socialDomains = ['instagram.com','facebook.com','m.facebook.com','tiktok.com','twitter.com','x.com','youtube.com','linkedin.com'];
    const socials = Array.from(new Set(hrefs)).filter(u => {
      try {
        const h = new URL(u).hostname.toLowerCase();
        return socialDomains.some(d => h === d || h.endsWith('.' + d) || h.includes(d + '/'));
      } catch (e) { return false; }
    });

    // map hostname -> canonical platform name
    function inferPlatformFromUrl(u) {
      try {
        const h = new URL(u).hostname.toLowerCase();
        if (h.includes('instagram.com')) return 'instagram';
        if (h.includes('facebook.com') || h.includes('m.facebook.com')) return 'facebook';
        if (h.includes('tiktok.com')) return 'tiktok';
        if (h.includes('twitter.com') || h === 'x.com' || h.includes('.x.com')) return 'twitter';
        if (h.includes('youtube.com') || h.includes('youtu.be')) return 'youtube';
        if (h.includes('linkedin.com')) return 'linkedin';
        return null;
      } catch (e) { return null; }
    }

    // find handles heuristically within page text
    const bodyText = await page.$$eval('body', nodes => nodes.map(n => n.innerText || n.textContent).join('\n'));
    const handleMatches = Array.from(new Set((bodyText.match(/@([A-Za-z0-9_.]{3,40})/g) || []).map(h => h.replace(/^@/, ''))));

    // For convenience return inferred platforms for socials
    const socialsWithPlatform = socials.map(u => ({ url: u, platform: inferPlatformFromUrl(u) }));

    // attempt to extract an og:image (profile / preview image) from the visited page
    let profile_image = null;
    try {
      profile_image = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null);
      if (!profile_image) {
        profile_image = await page.$eval('link[rel="image_src"]', el => el.href).catch(() => null);
      }
    } catch (e) {
      profile_image = null;
    }

    return { targetUrl, htmlPath, imgPath, socials: socialsWithPlatform, handles: handleMatches, profile_image };
  } finally {
    try { await page.close(); } catch (e) {}
  }
}

async function run({ yelpId = null, name = null, location = null, dryRun = true } = {}) {
  const browser = await chromium.launch({ headless: true });
  try {
    let business = null;
    if (yelpId) {
      business = await yelpGetBusiness(yelpId);
    } else if (name) {
      const search = await yelpSearchByName(name, location || '');
      business = (search.businesses && search.businesses[0]) || null;
    } else {
      throw new Error('yelpId or name required');
    }
    if (!business) throw new Error('No Yelp business found');

    // Yelp page URL is business.url
    const yelpPage = business.url || `https://www.yelp.com/biz/${business.id}`;
    console.log('Yelp page ->', yelpPage);

    const external = await scrapeYelpForExternal(yelpPage, browser);
    console.log('Found external links on Yelp page:', external.length);

    const results = [];
    for (const ext of external) {
      try {
        const info = await visitAndExtract(ext, browser);
        // build candidate (prefer known social domains)
        const socialsList = (info.socials || []).map(s => (typeof s === 'string' ? { url: s, platform: null } : s));
        const preferred = socialsList.find(s => s.platform) || socialsList[0] || null;
        const profileUrl = preferred ? preferred.url : ext;
        const platformHint = preferred ? preferred.platform : null;
        const baseConfidence = platformHint ? 0.95 : 0.55;
        const candidate = { source_record: { yelp_business: business.id }, handles: info.handles || [], urls: socialsList.length ? socialsList.map(s=>s.url) : [ext], name: business.name, platform_hint: platformHint, base_confidence: baseConfidence };
        const verification = await verifyCandidate(candidate).catch(e => ({ heuristic: null, llm: null }));
        const evidence = { source: 'yelp_page', yelp_business: business.id, snapshot_html: info.htmlPath, snapshot_img: info.imgPath, verification };
        if (dryRun) {
          results.push({ ext, candidate, evidence });
          console.log('Dry-run candidate:', ext, 'handles=', candidate.handles.join(','), 'socials=', candidate.urls.join(','));
        } else {
          try {
            // prefer platform from preferred or verification heuristic
            const platform = platformHint || (verification && verification.heuristic && verification.heuristic.evidence && verification.heuristic.evidence[0] && verification.heuristic.evidence[0].platform) || null;
            const confidence = (verification && verification.heuristic && verification.heuristic.confidence) || baseConfidence;
            const created = await createCandidate({ platform, handle: candidate.handles[0] || null, profile_url: profileUrl || ext, name: business.name, evidence, confidence, source: 'yelp_scrape' });

            // Persist profile image (if discovered) into images table so it can be processed
            try {
              const profileImageUrl = info && (info.profile_image || null);
              if (created && created.id && profileImageUrl) {
                const insert = await pool.query(
                  'INSERT INTO images (source, source_id, url, fetched_at) VALUES ($1,$2,$3,now()) RETURNING id',
                  ['social', created.id, profileImageUrl]
                );
                console.log('Persisted social image for profile', created.id, 'image_id=', insert.rows && insert.rows[0] && insert.rows[0].id);
              }
            } catch (e) {
              console.warn('Failed to persist social profile image for', created && created.id, e && e.message);
            }

            results.push({ ext, created });
            console.log('Persisted social candidate for', profileUrl, 'platform=', platform, 'id=', created && created.id);
          } catch (e) { console.warn('createCandidate failed', e.message || e); }
        }
      } catch (e) { console.warn('Failed to visit external link', ext, e.message || e); }
    }

    return { business, external, results };
  } finally {
    await browser.close();
  }
}

module.exports = { run };

if (require.main === module) {
  (async () => {
    const argv = process.argv.slice(2);
    const flags = argv.filter(a => a.startsWith('--'));
    const args = argv.filter(a => !a.startsWith('--'));
    let yelpId = null, name = null, location = null;
    if (args.length === 1 && args[0].includes('yelp.com') ) {
      // try to extract business id
      const parts = args[0].split('/');
      yelpId = parts[parts.length-1] || parts[parts.length-2];
    } else if (args.length === 1 && args[0].startsWith('biz_') ) {
      yelpId = args[0];
    } else if (args.length >= 1) {
      name = args[0];
      location = args[1] || '';
    }
    const dryRun = flags.includes('--dry-run') || !flags.includes('--persist');
    try {
      const out = await run({ yelpId, name, location, dryRun });
      console.log('\nDone. Found external links:', out.external.length, 'candidates:', out.results.length);
      process.exit(0);
    } catch (e) {
      console.error('Error', e.message || e);
      process.exit(1);
    }
  })();
}
