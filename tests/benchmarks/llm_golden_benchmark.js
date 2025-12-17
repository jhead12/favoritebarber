/**
 * LLM Golden Dataset Benchmark
 * 
 * Tests LLM providers against the golden dataset in tests/fixtures/llm_golden.json
 * Measures accuracy, latency, and cost estimates for each provider.
 * 
 * Usage:
 *   node tests/benchmarks/llm_golden_benchmark.js [provider]
 *   LLM_PROVIDER=openai node tests/benchmarks/llm_golden_benchmark.js
 *   
 * Examples:
 *   node tests/benchmarks/llm_golden_benchmark.js mock
 *   node tests/benchmarks/llm_golden_benchmark.js openai
 *   node tests/benchmarks/llm_golden_benchmark.js ollama
 * 
 * Note: For providers requiring API keys (openai, huggingface, replicate),
 * set environment variables directly: OPENAI_API_KEY=xxx node ...
 */

const fs = require('fs');
const path = require('path');
const llm = require('../../workers/llm/llm_client');

// Load golden dataset
const GOLDEN_PATH = path.join(__dirname, '../fixtures/llm_golden.json');
const goldenData = JSON.parse(fs.readFileSync(GOLDEN_PATH, 'utf8'));

// Configuration
const PROVIDER = process.env.LLM_PROVIDER || process.argv[2] || 'mock';
const VERBOSE = process.env.VERBOSE === 'true' || process.argv.includes('--verbose');

// Colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.blue}║              LLM Golden Dataset Benchmark - Provider: ${PROVIDER.toUpperCase().padEnd(11)}       ║${colors.reset}`);
console.log(`${colors.blue}╚════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);

// Metrics
const results = {
  provider: PROVIDER,
  total: goldenData.length,
  processed: 0,
  errors: 0,
  nameAccuracy: { correct: 0, partial: 0, incorrect: 0 },
  sentimentAccuracy: { correct: 0, close: 0, incorrect: 0 },
  summaryQuality: { good: 0, acceptable: 0, poor: 0 },
  latency: [],
  startTime: Date.now()
};

// Helper: Check if arrays have any overlap
function hasOverlap(arr1, arr2) {
  if (!arr1 || !arr2) return false;
  return arr1.some(item => arr2.includes(item));
}

// Helper: Calculate sentiment accuracy
function checkSentiment(actual, expected) {
  if (actual === expected) return 'correct';
  if (Math.abs(actual - expected) <= 0.3) return 'close';
  return 'incorrect';
}

// Helper: Check summary quality
function checkSummary(summary, expectedContains, originalText) {
  if (!summary || summary.length === 0) return 'poor';
  
  const summaryLower = summary.toLowerCase();
  const originalLower = originalText.toLowerCase();
  
  // Check if summary contains expected keywords
  let matchCount = 0;
  if (expectedContains && Array.isArray(expectedContains)) {
    for (const keyword of expectedContains) {
      if (summaryLower.includes(keyword.toLowerCase())) matchCount++;
    }
  }
  
  // Check if summary is not just truncated original
  const isTruncated = originalLower.startsWith(summaryLower.trim().toLowerCase());
  
  if (matchCount >= 2 && !isTruncated) return 'good';
  if (matchCount >= 1 || summary.length >= 20) return 'acceptable';
  return 'poor';
}

// Main benchmark function
async function runBenchmark() {
  console.log(`${colors.cyan}Testing ${results.total} reviews from golden dataset...${colors.reset}\n`);
  
  // Initialize provider
  await llm.init();
  
  for (const item of goldenData) {
    const startTime = Date.now();
    
    try {
      // Extract names
      const names = await llm.extractNamesFromReview(item.text);
      
      // Analyze sentiment
      const sentiment = await llm.analyzeSentiment(item.text);
      
      // Summarize review
      const summary = await llm.summarizeReview(item.text, 24);
      
      const latency = Date.now() - startTime;
      results.latency.push(latency);
      
      // Check name extraction accuracy
      if (item.expected && item.expected.names) {
        if (JSON.stringify(names) === JSON.stringify(item.expected.names)) {
          results.nameAccuracy.correct++;
        } else if (hasOverlap(names, item.expected.names)) {
          results.nameAccuracy.partial++;
        } else {
          results.nameAccuracy.incorrect++;
        }
      }
      
      // Check sentiment accuracy
      if (item.expected && typeof item.expected.sentiment === 'number') {
        const sentimentResult = checkSentiment(sentiment, item.expected.sentiment);
        results.sentimentAccuracy[sentimentResult]++;
      }
      
      // Check summary quality
      const summaryResult = checkSummary(summary, item.expected?.summary_contains, item.text);
      results.summaryQuality[summaryResult]++;
      
      results.processed++;
      
      if (VERBOSE) {
        console.log(`${colors.cyan}Review ${item.id}:${colors.reset}`);
        console.log(`  Text: ${item.text.slice(0, 60)}...`);
        console.log(`  Names: ${JSON.stringify(names)} (expected: ${JSON.stringify(item.expected?.names)})`);
        console.log(`  Sentiment: ${sentiment} (expected: ${item.expected?.sentiment})`);
        console.log(`  Summary: ${summary.slice(0, 60)}...`);
        console.log(`  Latency: ${latency}ms\n`);
      } else {
        // Progress indicator
        if (results.processed % 10 === 0) {
          process.stdout.write(`${colors.green}.${colors.reset}`);
        }
      }
      
    } catch (error) {
      results.errors++;
      if (VERBOSE) {
        console.error(`${colors.red}Error processing review ${item.id}: ${error.message}${colors.reset}`);
      }
    }
  }
  
  if (!VERBOSE) console.log('\n');
}

// Print results
function printResults() {
  const endTime = Date.now();
  const totalTime = (endTime - results.startTime) / 1000;
  const avgLatency = results.latency.reduce((a, b) => a + b, 0) / results.latency.length;
  const p95Latency = results.latency.sort((a, b) => a - b)[Math.floor(results.latency.length * 0.95)];
  
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║                              Benchmark Results                             ║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`${colors.cyan}Provider:${colors.reset} ${PROVIDER}`);
  console.log(`${colors.cyan}Dataset Size:${colors.reset} ${results.total} reviews`);
  console.log(`${colors.cyan}Processed:${colors.reset} ${results.processed} (${((results.processed / results.total) * 100).toFixed(1)}%)`);
  console.log(`${colors.cyan}Errors:${colors.reset} ${results.errors}\n`);
  
  console.log(`${colors.yellow}Name Extraction Accuracy:${colors.reset}`);
  const nameTotal = results.nameAccuracy.correct + results.nameAccuracy.partial + results.nameAccuracy.incorrect;
  console.log(`  Correct: ${results.nameAccuracy.correct}/${nameTotal} (${((results.nameAccuracy.correct / nameTotal) * 100).toFixed(1)}%)`);
  console.log(`  Partial: ${results.nameAccuracy.partial}/${nameTotal} (${((results.nameAccuracy.partial / nameTotal) * 100).toFixed(1)}%)`);
  console.log(`  Incorrect: ${results.nameAccuracy.incorrect}/${nameTotal} (${((results.nameAccuracy.incorrect / nameTotal) * 100).toFixed(1)}%)\n`);
  
  console.log(`${colors.yellow}Sentiment Analysis Accuracy:${colors.reset}`);
  const sentimentTotal = results.sentimentAccuracy.correct + results.sentimentAccuracy.close + results.sentimentAccuracy.incorrect;
  console.log(`  Correct: ${results.sentimentAccuracy.correct}/${sentimentTotal} (${((results.sentimentAccuracy.correct / sentimentTotal) * 100).toFixed(1)}%)`);
  console.log(`  Close: ${results.sentimentAccuracy.close}/${sentimentTotal} (${((results.sentimentAccuracy.close / sentimentTotal) * 100).toFixed(1)}%)`);
  console.log(`  Incorrect: ${results.sentimentAccuracy.incorrect}/${sentimentTotal} (${((results.sentimentAccuracy.incorrect / sentimentTotal) * 100).toFixed(1)}%)\n`);
  
  console.log(`${colors.yellow}Summary Quality:${colors.reset}`);
  const summaryTotal = results.summaryQuality.good + results.summaryQuality.acceptable + results.summaryQuality.poor;
  console.log(`  Good: ${results.summaryQuality.good}/${summaryTotal} (${((results.summaryQuality.good / summaryTotal) * 100).toFixed(1)}%)`);
  console.log(`  Acceptable: ${results.summaryQuality.acceptable}/${summaryTotal} (${((results.summaryQuality.acceptable / summaryTotal) * 100).toFixed(1)}%)`);
  console.log(`  Poor: ${results.summaryQuality.poor}/${summaryTotal} (${((results.summaryQuality.poor / summaryTotal) * 100).toFixed(1)}%)\n`);
  
  console.log(`${colors.yellow}Performance:${colors.reset}`);
  console.log(`  Total Time: ${totalTime.toFixed(2)}s`);
  console.log(`  Avg Latency: ${avgLatency.toFixed(0)}ms per review`);
  console.log(`  P95 Latency: ${p95Latency}ms`);
  console.log(`  Throughput: ${(results.processed / totalTime).toFixed(2)} reviews/sec\n`);
  
  // Overall score
  const nameScore = ((results.nameAccuracy.correct + results.nameAccuracy.partial * 0.5) / nameTotal) * 100;
  const sentimentScore = ((results.sentimentAccuracy.correct + results.sentimentAccuracy.close * 0.7) / sentimentTotal) * 100;
  const summaryScore = ((results.summaryQuality.good + results.summaryQuality.acceptable * 0.5) / summaryTotal) * 100;
  const overallScore = (nameScore + sentimentScore + summaryScore) / 3;
  
  const scoreColor = overallScore >= 80 ? colors.green : overallScore >= 60 ? colors.yellow : colors.red;
  console.log(`${colors.cyan}Overall Score:${colors.reset} ${scoreColor}${overallScore.toFixed(1)}%${colors.reset}`);
  console.log(`  Name Extraction: ${nameScore.toFixed(1)}%`);
  console.log(`  Sentiment Analysis: ${sentimentScore.toFixed(1)}%`);
  console.log(`  Summary Quality: ${summaryScore.toFixed(1)}%\n`);
  
  // Save results to file
  const resultsFile = path.join(__dirname, `../results/benchmark_${PROVIDER}_${Date.now()}.json`);
  fs.mkdirSync(path.dirname(resultsFile), { recursive: true });
  fs.writeFileSync(resultsFile, JSON.stringify({
    ...results,
    endTime,
    totalTime,
    avgLatency,
    p95Latency,
    scores: { nameScore, sentimentScore, summaryScore, overallScore }
  }, null, 2));
  
  console.log(`${colors.green}✓ Results saved to ${resultsFile}${colors.reset}\n`);
}

// Run benchmark
(async () => {
  try {
    await runBenchmark();
    printResults();
    process.exit(0);
  } catch (error) {
    console.error(`${colors.red}Benchmark failed: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  }
})();
