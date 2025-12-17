const path = require('path');
const fs = require('fs');

const FIXTURE = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'llm_golden.json');
const availableProviders = {
  mock: require('./providers/mock')
};

async function run(providerName) {
  const provider = availableProviders[providerName];
  if (!provider) throw new Error('Unknown provider: ' + providerName);
  const raw = fs.readFileSync(FIXTURE, 'utf8');
  const cases = JSON.parse(raw);
  let total = 0, nameMatches = 0, sentimentWithin = 0;
  const start = Date.now();
  for (const c of cases) {
    total++;
    const out = await provider.enrich(c);
    const exp = c.expected || {};
    // name match: any expected name present in out.names
    const expectedNames = (exp.names || []).map(String);
    const gotNames = (out.names || []).map(String);
    if (expectedNames.length === 0) {
      // tolerate no-name expected: treat as match if provider returned no strongly identified name
      if (gotNames.length === 0) nameMatches++;
    } else {
      for (const en of expectedNames) if (gotNames.includes(en)) { nameMatches++; break; }
    }
    const expSent = typeof exp.sentiment === 'number' ? exp.sentiment : null;
    if (expSent !== null) {
      const diff = Math.abs(expSent - (out.sentiment || 0));
      if (diff <= 0.25) sentimentWithin++;
    }
  }
  const dur = Date.now() - start;
  return { provider: providerName, total, nameMatches, sentimentWithin, durationMs: dur };
}

async function main() {
  const providers = Object.keys(availableProviders);
  console.log('Running benchmark for providers:', providers.join(','));
  for (const p of providers) {
    try {
      const r = await run(p);
      console.log(`Provider ${p}: total=${r.total} nameMatches=${r.nameMatches} sentimentWithin=${r.sentimentWithin} durationMs=${r.durationMs}`);
    } catch (e) {
      console.error('Error running provider', p, e && e.stack ? e.stack : e);
    }
  }
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(2); });
