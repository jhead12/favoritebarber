#!/usr/bin/env node
/**
 * Simple test script for Ollama/Llama local LLM
 * Run: node workers/llm/test_ollama.js
 */

const { checkOllama, extractNamesFromReview, analyzeSentiment, summarizeReview } = require('./ollama_client');

const SAMPLE_REVIEWS = [
  'Went to Tony at Main Street Barber — he did an amazing fade. Highly recommend Jason too.',
  'Shoutout to Maria for the perfect cut! Booked with her after seeing her work.',
  'I always go to the shop but today Sam was on duty and gave me a great trim.',
];

async function main() {
  console.log('Testing Ollama/Llama client...\n');
  
  const status = await checkOllama();
  if (!status.available) {
    console.log('ℹ Ollama is not running. Set up with:');
    console.log('  brew install ollama (macOS)');
    console.log('  ollama pull llama3.2:3b');
    console.log('  ollama serve');
    console.log('\nRunning in fallback heuristic mode.\n');
  }

  for (const review of SAMPLE_REVIEWS) {
    console.log('Review:', review);
    console.log('Names:', await extractNamesFromReview(review));
    console.log('Sentiment:', (await analyzeSentiment(review)).toFixed(2));
    console.log('Summary:', await summarizeReview(review, 15));
    console.log('---');
  }
}

main().catch(console.error);
