#!/usr/bin/env node
const { detectLanguage } = require('./language_utils');

const CASES = [
  { text: 'I asked for a low fade and it turned out great.', want: 'en' },
  { text: 'Pedí un corte degradado y quedó perfecto.', want: 'es' },
  { text: "J'ai demandé une coupe dégradée et c'était parfait.", want: 'fr' },
  { text: 'Ich habe einen Fade geschnitten bekommen und es ist toll.', want: 'de' },
  { text: 'Pedi um corte fade e ficou ótimo.', want: 'pt' },
  { text: 'Ho chiesto un taglio sfumato ed è venuto bene.', want: 'it' },
  { text: '👍👍', want: 'und' }
];

let pass = 0, fail = 0;
for (const c of CASES) {
  const res = detectLanguage(c.text);
  const got = res.lang || 'und';
  const ok = (c.want === 'und' && (got === 'und' || res.confidence < 0.3)) || got === c.want;
  if (ok) {
    pass++;
    console.log(`✓ ${c.want} — ${c.text.substring(0,30)} => ${got} (${res.confidence})`);
  } else {
    fail++;
    console.log(`✗ expected ${c.want} got ${got} for: ${c.text}`);
  }
}

console.log(`\nResult: ${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
