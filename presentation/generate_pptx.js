/*
Presentation PPTX generator for Favorite Barber
Usage:
  cd presentation
  npm install
  npm run build-pptx
Output: presentation/Favorite_Barber_Pitch.pptx

The script embeds `web/public/logo.png` if present.
*/

const fs = require('fs');
const path = require('path');
const PptxGenJS = require('pptxgenjs');

const outFile = path.join(__dirname, 'Favorite_Barber_Pitch.pptx');
const logoPath = path.join(__dirname, '..', 'web', 'public', 'logo.png');

function safeReadText(relPath) {
  try {
    return fs.readFileSync(path.join(__dirname, relPath), 'utf8');
  } catch (e) {
    return null;
  }
}

const slidesMd = safeReadText('slides.md') || `Favorite Barber\nFind a barber you can trust`;
const notesMd = safeReadText('speaker_notes.md') || '';
const handoutMd = safeReadText('one_page_handout.md') || '';

const pptx = new PptxGenJS();
pptx.defineLayout({ name: 'Widescreen', width: 13.333, height: 7.5 });
pptx.layout = 'Widescreen';

// Theme colors and font
const BRAND = { primary: '0B2545', accent: 'F59E0B', light: 'FFFFFF', muted: '6B7280' };
const FONT = { face: 'Arial', titleSize: 36, headingSize: 28, bodySize: 16 };

async function addCoverSlide(title, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: BRAND.light };
  // logo
  if (fs.existsSync(logoPath)) {
    slide.addImage({ path: logoPath, x: 0.4, y: 0.4, w: 1.2, h: 1.2 });
  }
  slide.addText(title, { x: 1.8, y: 0.9, w: 9.8, h: 1.4, fontSize: 44, bold: true, color: BRAND.primary, fontFace: FONT.face });
  slide.addText(subtitle, { x: 1.8, y: 2.6, w: 9.8, h: 0.9, fontSize: 20, color: BRAND.muted, fontFace: FONT.face });
  slide.addText('5-minute pitch', { x: 1.8, y: 3.6, fontSize: 12, color: BRAND.muted, fontFace: FONT.face });
}

function addTitleBulletSlide(title, bullets, notes) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.6, y: 0.4, fontSize: FONT.headingSize, bold: true, color: BRAND.primary, fontFace: FONT.face });
  slide.addText(bullets.map(b => '• ' + b).join('\n\n'), { x: 0.8, y: 1.2, w: 11.8, fontSize: FONT.bodySize, color: '#0F1724', fontFace: FONT.face, bullet: true, lineHeight: 20 });
  if (notes) slide.addNotes(notes);
}

function addTwoColumnSlide(title, leftLines, rightLines, notes) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.6, y: 0.4, fontSize: FONT.headingSize, bold: true, color: BRAND.primary, fontFace: FONT.face });
  slide.addText(leftLines.join('\n\n'), { x: 0.7, y: 1.1, w: 5.8, fontSize: FONT.bodySize, color: '#0F1724', fontFace: FONT.face });
  slide.addText(rightLines.join('\n\n'), { x: 7.0, y: 1.1, w: 5.8, fontSize: FONT.bodySize, color: '#0F1724', fontFace: FONT.face });
  if (fs.existsSync(logoPath)) {
    slide.addImage({ path: logoPath, x: 11.6, y: 6.0, w: 1.2, h: 1.2 });
  }
  if (notes) slide.addNotes(notes);
}

(async () => {
  try {
    // Parse slides.md minimal structure (we know the 6 slides)
    const md = slidesMd.split('\n\n').map(s => s.trim()).filter(Boolean);

    await addCoverSlide('Favorite Barber', 'Find a barber you can trust — AI-powered, privacy-first');

    addTitleBulletSlide('Problem', [
      'Directory sites show shop-level info; users can’t find the specific barber who does their style',
      'Reviews are noisy, photos irrelevant, and fake reviews cause mistrust',
      'Result: lost bookings and misattribution for individual barbers'
    ], 'Explain user pain: wrong barber, poor trust');

    addTitleBulletSlide('Solution', [
      'Normalize listings, attribute reviews to barbers, enrich with LLM + Vision',
      'Local LLMs (Ollama) + vision models for privacy-first enrichment',
      'Outputs: barber profiles, hairstyle tags, review summaries, trust scores'
    ], 'Emphasize privacy-first and outputs');

    addTwoColumnSlide('Tech & MCP Integration', [
      'Ingest: Yelp GraphQL + REST, Playwright workers',
      'Enrich: Ollama (local LLM) for sentiment, name-extraction, summarization',
      'Vision: Google Vision for image relevance'
    ], [
      'MCP Server: auth, rate-limits, telemetry, webhooks',
      'Exposes discover & enrichment endpoints to partners/agents',
      'Developer use-cases: ChatGPT plugin, Zapier automations, widgets'
    ], 'Walk through data flow: Yelp → workers → enrichment → DB → MCP');

    addTitleBulletSlide('Trust Signals & Demo', [
      'Trust signals: photo authenticity, review sentiment & attribution, verification, recency, spam penalty',
      'API demo: search & MCP discover (show curl commands)',
      'Visual: profile with trust_score, hairstyles, verified badge'
    ], 'Show API curl examples from speaker notes');

    addTitleBulletSlide('Growth & Ask', [
      'Roadmap: Consumer MVP → MCP → Barber SaaS + marketplace',
      'Monetization: booking fees, premium listings, barber SaaS ($29/mo), MCP partner tiers ($299/mo)',
      'Ask: beta partners, design help, $50k seed'
    ], 'Close with ask and next steps');

    // Add one slide with a compact one-page handout summary
    const slide = pptx.addSlide();
    slide.addText('One-page Summary', { x: 0.5, y: 0.4, fontSize: 24, bold: true, color: BRAND.primary });
    slide.addText([ 'Find the specific barber who can deliver your style — not just the shop.', '', 'Features:', '• Barber-level attribution', '• Trust signals & verified photos', '• MCP API for partners', '', 'Pricing examples: Free / Pro $299/mo / Barber SaaS $29/mo', '', 'Contact: [your email]' ].join('\n'), { x: 0.6, y: 1.1, w: 12.5, fontSize: 12, color: BRAND.muted });
    if (fs.existsSync(logoPath)) {
      slide.addImage({ path: logoPath, x: 11.8, y: 6.0, w: 1.2, h: 1.2 });
    }

    // Save file
    await pptx.writeFile({ fileName: outFile });
    console.log('PPTX generated:', outFile);
  } catch (err) {
    console.error('Failed to generate PPTX:', err);
    process.exitCode = 1;
  }
})();
