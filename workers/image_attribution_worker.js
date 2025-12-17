#!/usr/bin/env node
// Worker: polls images with caption but no attribution_metadata and uses OpenAI to extract barber mentions
const { pool } = require('../api/db');
const { extractBarberNamesFromCaption } = require('../api/lib/imageAttribution');

async function fetchPending(limit = 20) {
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, url, caption, shop_id FROM images WHERE caption IS NOT NULL AND attribution_metadata IS NULL LIMIT $1", [limit]);
    return res.rows || [];
  } finally {
    client.release();
  }
}

async function processOne(img) {
  try {
    const mentioned = await extractBarberNamesFromCaption(img.caption || '', img.shop_id);
    const metadata = { source: 'caption', mentioned_count: mentioned.length, barber_ids: mentioned };
    if (mentioned.length === 1) {
      // attribute to single barber
      await pool.query('UPDATE images SET barber_id=$1, attribution_metadata=$2 WHERE id=$3', [mentioned[0], metadata, img.id]);
      console.log('Attributed image', img.id, 'to barber', mentioned[0]);
    } else {
      // keep as shop image
      await pool.query('UPDATE images SET attribution_metadata=$1 WHERE id=$2', [metadata, img.id]);
      console.log('Kept image', img.id, 'as shop (mentioned_count=', mentioned.length, ')');
    }
  } catch (e) {
    console.warn('Attribution failed for image', img.id, e && e.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limitArg = args.includes('--limit') ? Number(args[args.indexOf('--limit')+1] || 20) : 20;
  const pending = await fetchPending(limitArg);
  if (!pending.length) {
    console.log('No pending images for attribution');
    return;
  }
  for (const img of pending) {
    await processOne(img);
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1); });
}
