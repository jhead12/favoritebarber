#!/usr/bin/env node
/*
 Test exports for image_processor
 Allows testing of internal functions
*/

/**
 * Detect probable hairstyles from analysis labels/text
 * Returns an array of canonical hairstyle strings (no duplicates)
 * 
 * Based on canonical vocabulary from docs/HAIRSTYLES.md
 */
function detectHairstylesFromAnalysis(analysis) {
  const candidates = new Set();
  const textSources = [];
  
  if (analysis.labels && Array.isArray(analysis.labels)) {
    textSources.push(...analysis.labels.map(l => l.description));
  }
  if (analysis.ocr && analysis.ocr.text) {
    textSources.push(analysis.ocr.text);
  }
  
  // Lowercase joined text for keyword search
  const joined = textSources.join(' ').toLowerCase();

  // Comprehensive mapping based on docs/HAIRSTYLES.md
  const mapping = {
    'fade': ['fade', 'low fade', 'mid fade', 'high fade', 'skin fade', 'temple fade', 'bald fade', 'drop fade', 'taper fade'],
    'taper': ['taper', 'temple taper'],
    'buzz cut': ['buzz cut', 'buzzcut', 'induction cut'],
    'crew cut': ['crew cut'],
    'caesar': ['caesar cut', 'caesar'],
    'ivy league': ['ivy league', 'harvard clip'],
    'undercut': ['undercut', 'disconnected undercut'],
    'pompadour': ['pompadour'],
    'quiff': ['quiff'],
    'slick back': ['slick back', 'slicked back'],
    'comb over': ['comb over', 'combover', 'side part'],
    'french crop': ['french crop', 'crop'],
    'textured crop': ['textured crop'],
    'curly top': ['curly top', 'curls', 'coily top'],
    'afro': ['afro'],
    'twist/coils': ['twists', 'coils', 'two-strand twists', 'two strand twists'],
    'mohawk': ['mohawk', 'frohawk', 'mohawked'],
    'mullet': ['mullet'],
    'long layered': ['long hair', 'layered hair', 'layers', 'layered'],
    'shag': ['shag cut', 'shag'],
    'bowl cut': ['bowl cut'],
    'wolf cut': ['wolf cut'],
    'man bun': ['man bun', 'top knot', 'topknot'],
    'fringe': ['fringe', 'bangs'],
    'scissor cut': ['scissor cut', 'scissors'],
    'beard trim': ['beard trim', 'beard', 'trim', 'facial hair']
  };

  // Search for each canonical style
  for (const [canonical, keywords] of Object.entries(mapping)) {
    for (const keyword of keywords) {
      if (joined.includes(keyword)) {
        candidates.add(canonical);
        break;
      }
    }
  }

  return Array.from(candidates);
}

module.exports = {
  detectHairstylesFromAnalysis
};
