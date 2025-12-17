#!/usr/bin/env node
/**
 * Compare OpenAI (ChatGPT) vs Ollama accuracy on the same test cases
 * Usage: 
 *   1. Set OPENAI_API_KEY in .env
 *   2. Run: node workers/llm/test_openai_vs_ollama.js
 */

const ollamaClient = require('./ollama_client');
const llmClient = require('./llm_client');

const TEST_REVIEWS = [
  {
    id: 1,
    text: "I went to Budget Barbers yesterday and asked for a fade. John did an absolutely amazing job! He's a true professional.",
    expectedNames: ["John"],
    expectedSentiment: 1,
    description: "Clear positive with barber name"
  },
  {
    id: 2,
    text: "Downtown Barbershop is the best! Mike gave me the best haircut I've ever had. Very friendly staff.",
    expectedNames: ["Mike"],
    expectedSentiment: 1,
    description: "Enthusiastic positive"
  },
  {
    id: 3,
    text: "I went to City Cuts and got a terrible haircut. The barber, Tony, didn't listen to what I asked for.",
    expectedNames: ["Tony"],
    expectedSentiment: -1,
    description: "Negative with barber name"
  },
  {
    id: 4,
    text: "Great experience at Elite Barbers. The barber was very professional and the cut came out perfect.",
    expectedNames: [],
    expectedSentiment: 1,
    description: "Positive, no specific barber"
  },
  {
    id: 5,
    text: "Average haircut at Downtown Barbershop. The barber was okay but not great. Price is reasonable though.",
    expectedNames: [],
    expectedSentiment: 0,
    description: "Neutral sentiment"
  },
  {
    id: 6,
    text: "The haircut was good but the service was slow. Waited 45 minutes. Barber didn't give much attention.",
    expectedNames: [],
    expectedSentiment: 0,
    description: "Mixed sentiment"
  }
];

function compareNames(expected, actual) {
  if (expected.length === 0 && actual.length === 0) return true;
  if (expected.length === 0) return false;
  return expected.some(name => actual.includes(name));
}

async function testProvider(providerName, extractNamesFn, analyzeSentimentFn) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Testing: ${providerName.toUpperCase()}`);
  console.log('='.repeat(80));

  let nameCorrect = 0;
  let sentimentCorrect = 0;
  const results = [];

  for (const test of TEST_REVIEWS) {
    console.log(`\nTest #${test.id}: ${test.description}`);
    console.log(`Review: "${test.text.slice(0, 80)}..."`);

    try {
      const names = await extractNamesFn(test.text);
      const sentiment = await analyzeSentimentFn(test.text);

      const nameMatch = compareNames(test.expectedNames, names);
      const sentimentMatch = sentiment === test.expectedSentiment;

      if (nameMatch) nameCorrect++;
      if (sentimentMatch) sentimentCorrect++;

      console.log(`  Names: ${names.length ? names.join(', ') : '(none)'} ${nameMatch ? '✅' : '❌'} (expected: ${test.expectedNames.length ? test.expectedNames.join(', ') : 'none'})`);
      console.log(`  Sentiment: ${sentiment === 1 ? 'positive' : sentiment === -1 ? 'negative' : 'neutral'} (${sentiment}) ${sentimentMatch ? '✅' : '❌'} (expected: ${test.expectedSentiment})`);

      results.push({
        id: test.id,
        nameMatch,
        sentimentMatch,
        names,
        sentiment
      });
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      results.push({ id: test.id, error: err.message });
    }
  }

  console.log(`\n${'─'.repeat(80)}`);
  console.log(`${providerName.toUpperCase()} RESULTS:`);
  console.log(`  Name Recognition: ${nameCorrect}/${TEST_REVIEWS.length} (${(nameCorrect/TEST_REVIEWS.length*100).toFixed(1)}%)`);
  console.log(`  Sentiment Analysis: ${sentimentCorrect}/${TEST_REVIEWS.length} (${(sentimentCorrect/TEST_REVIEWS.length*100).toFixed(1)}%)`);
  console.log('='.repeat(80));

  return { provider: providerName, nameCorrect, sentimentCorrect, total: TEST_REVIEWS.length, results };
}

async function main() {
  console.log('\n🧪 OPENAI (ChatGPT) vs OLLAMA COMPARISON TEST\n');
  
  // Test Ollama first
  await ollamaClient.checkOllama();
  const ollamaResults = await testProvider(
    'Ollama (llama3.2:3b)',
    (text) => ollamaClient.extractNamesFromReview(text),
    (text) => ollamaClient.analyzeSentiment(text)
  );

  // Check if OpenAI is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('\n⚠️  OPENAI_API_KEY not configured in .env');
    console.log('To test OpenAI/ChatGPT:');
    console.log('  1. Get API key from https://platform.openai.com/api-keys');
    console.log('  2. Add to .env: OPENAI_API_KEY=sk-your-key-here');
    console.log('  3. Set LLM_PROVIDER=openai in .env');
    console.log('  4. Run this test again\n');
    return;
  }

  // Test OpenAI
  const originalProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = 'openai';
  
  const openaiResults = await testProvider(
    'OpenAI (gpt-4o-mini)',
    (text) => llmClient.extractNamesFromReview(text),
    (text) => llmClient.analyzeSentiment(text)
  );

  process.env.LLM_PROVIDER = originalProvider;

  // Comparison summary
  console.log('\n\n📊 COMPARISON SUMMARY\n');
  console.log('┌─────────────────────────┬─────────────────┬──────────────────┐');
  console.log('│ Provider                │ Name Recognition│ Sentiment        │');
  console.log('├─────────────────────────┼─────────────────┼──────────────────┤');
  console.log(`│ Ollama (llama3.2:3b)    │ ${ollamaResults.nameCorrect}/${ollamaResults.total} (${(ollamaResults.nameCorrect/ollamaResults.total*100).toFixed(1)}%)      │ ${ollamaResults.sentimentCorrect}/${ollamaResults.total} (${(ollamaResults.sentimentCorrect/ollamaResults.total*100).toFixed(1)}%)       │`);
  console.log(`│ OpenAI (gpt-4o-mini)    │ ${openaiResults.nameCorrect}/${openaiResults.total} (${(openaiResults.nameCorrect/openaiResults.total*100).toFixed(1)}%)      │ ${openaiResults.sentimentCorrect}/${openaiResults.total} (${(openaiResults.sentimentCorrect/openaiResults.total*100).toFixed(1)}%)       │`);
  console.log('└─────────────────────────┴─────────────────┴──────────────────┘\n');

  const nameImprovement = openaiResults.nameCorrect - ollamaResults.nameCorrect;
  const sentimentImprovement = openaiResults.sentimentCorrect - ollamaResults.sentimentCorrect;

  if (nameImprovement > 0 || sentimentImprovement > 0) {
    console.log('✅ OpenAI shows improvement over Ollama:');
    if (nameImprovement > 0) console.log(`   • Name recognition: +${nameImprovement} tests`);
    if (sentimentImprovement > 0) console.log(`   • Sentiment analysis: +${sentimentImprovement} tests`);
  } else if (nameImprovement < 0 || sentimentImprovement < 0) {
    console.log('⚠️  Ollama performing better in some areas:');
    if (nameImprovement < 0) console.log(`   • Name recognition: Ollama +${Math.abs(nameImprovement)} tests`);
    if (sentimentImprovement < 0) console.log(`   • Sentiment analysis: Ollama +${Math.abs(sentimentImprovement)} tests`);
  } else {
    console.log('🤝 Both providers show similar performance on this test set');
  }

  console.log('\n💡 Recommendation:');
  if (openaiResults.nameCorrect > ollamaResults.nameCorrect || openaiResults.sentimentCorrect > ollamaResults.sentimentCorrect) {
    console.log('   Use OpenAI for better accuracy (has API costs)');
    console.log('   To switch: Set LLM_PROVIDER=openai in .env');
  } else {
    console.log('   Continue with Ollama (free, local, privacy-focused)');
  }
  console.log('');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
