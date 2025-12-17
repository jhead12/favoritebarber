const path = require('path');
const fs = require('fs');

const FIXTURE = path.resolve(__dirname, '..', '..', 'tests', 'fixtures', 'llm_golden.json');

// Load available providers (with error handling)
const availableProviders = {};
try { availableProviders.mock = require('./providers/mock'); } catch (e) { console.warn('mock provider not available'); }
try { availableProviders.ollama = require('./providers/ollama'); } catch (e) { console.warn('ollama provider not available'); }
try { availableProviders.openai = require('./providers/openai'); } catch (e) { console.warn('openai provider not available'); }

// Provider-specific adapters (normalize outputs to common format)
async function callProvider(provider, providerName, testCase) {
  const text = testCase.text;
  
  if (providerName === 'mock') {
    return await provider.enrich({ text });
  }
  
  // For ollama and openai, call individual functions
  const [names, sentiment, summary] = await Promise.all([
    provider.extractNamesFromReview(text).catch(() => []),
    provider.analyzeSentiment(text).catch(() => 0),
    provider.summarizeReview(text).catch(() => '')
  ]);
  
  return { names, sentiment, summary };
}

async function run(providerName) {
  const provider = availableProviders[providerName];
  if (!provider) throw new Error('Unknown provider: ' + providerName);
  
  const raw = fs.readFileSync(FIXTURE, 'utf8');
  const cases = JSON.parse(raw);
  
  let total = 0, nameMatches = 0, sentimentWithin = 0;
  const latencies = [];
  const start = Date.now();
  
  for (const c of cases) {
    total++;
    const caseStart = Date.now();
    
    try {
      const out = await callProvider(provider, providerName, c);
      const latency = Date.now() - caseStart;
      latencies.push(latency);
      
      const exp = c.expected || {};
      
      // Name match: any expected name present in out.names
      const expectedNames = (exp.names || []).map(String);
      const gotNames = (out.names || []).map(String);
      
      if (expectedNames.length === 0) {
        // If no names expected, match if provider returned no names OR only generic names
        if (gotNames.length === 0 || gotNames.every(n => n.length < 2)) {
          nameMatches++;
        }
      } else {
        // If names expected, match if ANY expected name is in results
        for (const en of expectedNames) {
          if (gotNames.some(gn => gn.toLowerCase() === en.toLowerCase())) {
            nameMatches++;
            break;
          }
        }
      }
      
      // Sentiment match: within 0.25 of expected (on 0-1 scale)
      const expSent = typeof exp.sentiment === 'number' ? exp.sentiment : null;
      if (expSent !== null) {
        const gotSent = typeof out.sentiment === 'number' ? out.sentiment : 0;
        const diff = Math.abs(expSent - gotSent);
        if (diff <= 0.25) sentimentWithin++;
      }
    } catch (err) {
      console.warn(`Provider ${providerName} failed on case ${c.id}:`, err.message);
      latencies.push(0); // Record timeout/failure
    }
  }
  
  const totalDuration = Date.now() - start;
  
  // Calculate latency percentiles
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length || 0;
  
  return {
    provider: providerName,
    total,
    nameMatches,
    sentimentWithin,
    nameAccuracy: ((nameMatches / total) * 100).toFixed(1),
    sentimentAccuracy: ((sentimentWithin / total) * 100).toFixed(1),
    durationMs: totalDuration,
    avgLatencyMs: Math.round(avgLatency),
    p50LatencyMs: p50,
    p95LatencyMs: p95
  };
}

async function main() {
  // Parse CLI args for provider selection
  const args = process.argv.slice(2);
  let selectedProviders = args.length > 0 ? args[0].split(',') : Object.keys(availableProviders);
  
  // Filter to only available providers
  selectedProviders = selectedProviders.filter(p => availableProviders[p]);
  
  if (selectedProviders.length === 0) {
    console.error('No providers available. Make sure at least one provider is configured.');
    process.exit(1);
  }
  
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                          LLM Provider Benchmark                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');
  console.log(`Running benchmark with ${selectedProviders.length} provider(s): ${selectedProviders.join(', ')}\n`);
  
  const results = [];
  
  for (const p of selectedProviders) {
    try {
      console.log(`Testing ${p}...`);
      const r = await run(p);
      results.push(r);
    } catch (e) {
      console.error(`Error running provider ${p}:`, e.message);
    }
  }
  
  if (results.length === 0) {
    console.error('No results to display.');
    process.exit(1);
  }
  
  // Display results table
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                              Benchmark Results                               ║');
  console.log('╠══════════════╦═══════╦════════════╦══════════════╦══════════╦═════╦═════════╣');
  console.log('║   Provider   ║ Cases ║ Name Acc % ║ Sentiment %  ║ Avg (ms) ║ P50 ║  P95    ║');
  console.log('╠══════════════╬═══════╬════════════╬══════════════╬══════════╬═════╬═════════╣');
  
  results.forEach(r => {
    const provider = r.provider.padEnd(12);
    const cases = String(r.total).padStart(5);
    const nameAcc = String(r.nameAccuracy + '%').padStart(10);
    const sentAcc = String(r.sentimentAccuracy + '%').padStart(12);
    const avg = String(r.avgLatencyMs).padStart(8);
    const p50 = String(r.p50LatencyMs).padStart(4);
    const p95 = String(r.p95LatencyMs).padStart(7);
    
    console.log(`║ ${provider} ║ ${cases} ║ ${nameAcc} ║ ${sentAcc} ║ ${avg} ║ ${p50} ║ ${p95} ║`);
  });
  
  console.log('╚══════════════╩═══════╩════════════╩══════════════╩══════════╩═════╩═════════╝\n');
  
  // Cost estimates (rough)
  console.log('Cost Estimates (per 1000 reviews):');
  results.forEach(r => {
    let costPer1k = 'N/A';
    if (r.provider === 'openai') {
      // gpt-4o-mini: ~$0.15/1M input tokens, ~$0.60/1M output tokens
      // Rough estimate: 3 calls * (100 input + 50 output tokens) ≈ 450 tokens
      // Cost per review: ~$0.0001, per 1000: ~$0.10
      costPer1k = '$0.10-0.20';
    } else if (r.provider === 'ollama') {
      costPer1k = '$0.00 (local)';
    } else if (r.provider === 'mock') {
      costPer1k = '$0.00 (mock)';
    }
    console.log(`  ${r.provider}: ${costPer1k}`);
  });
  
  console.log('\n✅ Benchmark complete!\n');
}

if (require.main === module) main().catch(e => { console.error(e); process.exit(2); });
