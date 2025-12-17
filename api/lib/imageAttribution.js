const fetch = global.fetch || require('node-fetch');
const { pool } = require('../db');

// Minimal OpenAI wrapper — expects OPENAI_API_KEY in env
async function callOpenAI(prompt, maxTokens = 200) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not configured');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.0,
      max_tokens: maxTokens
    })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`OpenAI error: ${res.status} ${txt}`);
  }
  const j = await res.json();
  const content = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
  return content;
}

// Given a caption and shopId, return array of matched barber ids (may be empty)
async function extractBarberNamesFromCaption(caption, shopId) {
  if (!caption || !caption.trim()) return [];
  // fetch barbers at shop for context
  let barbers = [];
  try {
    const qr = await pool.query('SELECT id, name FROM barbers JOIN shop_barbers sb ON sb.barber_id=barbers.id WHERE sb.shop_id=$1', [shopId]);
    barbers = qr.rows || [];
  } catch (e) {
    barbers = [];
  }

  const barberList = barbers.map(b => b.name).join(', ');
  const prompt = `You are given a photo caption and a list of barber names who work at a shop.\nCaption: "${caption.replace(/\"/g, '\\"')}"\nBarbers: ${barberList || '(none)'}\nTask: Return a JSON array named mentioned that lists the barber full names exactly as they appear in the barbers list that are mentioned in the caption. If none are mentioned, return an empty array. Example output: {"mentioned": ["Carlos Ruiz"]}\nOnly output valid JSON.`;

  try {
    const out = await callOpenAI(prompt, 150);
    // try to parse JSON from response
    const m = out && out.match(/\{[\s\S]*\}/);
    const jsonText = m ? m[0] : out;
    const parsed = JSON.parse(jsonText);
    const names = parsed.mentioned || [];
    // map names to ids
    const matched = barbers.filter(b => names.includes(b.name)).map(b => b.id);
    return matched;
  } catch (e) {
    console.warn('Attribution OpenAI failed', e.message || e);
    return [];
  }
}

module.exports = { extractBarberNamesFromCaption };
