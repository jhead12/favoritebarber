// Node version of the review name extraction heuristic test
const SAMPLE_REVIEWS = [
  "Went to Tony at Main Street Barber — he did an amazing fade. Highly recommend Jason too.",
  "Shoutout to Maria for the perfect cut! Booked with her after seeing her work.",
  "I always go to the shop but today Sam was on duty and gave me a great trim.",
  "The barber (not sure of his name) did fine, but ask for Chris if you want a fade.",
  "Fantastic service by the crew at Downtown Barbershop. Special mention: Luis!"
];

function extractCandidateNames(text) {
  const candidates = new Set();
  const patterns = [
    /to\s+([A-Z][a-z]{1,20})\s+at/i,
    /to\s+([A-Z][a-z]{1,20})[\.\!]/i,
    /by\s+([A-Z][a-z]{1,20})/i,
    /ask for\s+([A-Z][a-z]{1,20})/i,
    /mention[:\s]+([A-Z][a-z]{1,20})/i,
    /shoutout to\s+([A-Z][a-z]{1,20})/i,
    /special mention[:\s]*([A-Z][a-z]{1,20})/i,
    /today\s+([A-Z][a-z]{1,20})\s+was/i,
    /with\s+([A-Z][a-z]{1,20})\s+after/i
  ];

  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const name = m[1].trim();
      candidates.add(capitalize(name));
      // avoid infinite loops for global-less regex
      break;
    }
  }

  // fallback: capitalized tokens
  const words = text.match(/\b([A-Z][a-z]{1,20})\b/g) || [];
  for (const w of words) {
    if (!['I','The','A','An','Main','Street','Barbershop','Downtown','Barber','Shop'].includes(w)) {
      candidates.add(capitalize(w));
    }
  }

  return Array.from(candidates);
}

function capitalize(s) {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function main() {
  SAMPLE_REVIEWS.forEach((r, i) => {
    console.log(`Review ${i+1}:`);
    console.log(' ', r);
    console.log(' Candidates:', extractCandidateNames(r));
    console.log('');
  });
}

if (require.main === module) main();
