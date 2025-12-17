// Thin wrapper to reuse existing ollama_client implementation
const ollama = require('../ollama_client');
module.exports = {
  init: ollama.checkOllama,
  extractNamesFromReview: ollama.extractNamesFromReview,
  analyzeSentiment: ollama.analyzeSentiment,
  summarizeReview: ollama.summarizeReview,
  extractAdjectivesFromReview: ollama.extractAdjectivesFromReview,
  call: ollama.call
};
