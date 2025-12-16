#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { pool } = require('../db');

// Usage:
// node reconcile_orphan_image_analyses.js --auto --limit=100 --export-csv=orphans.csv --dry-run

const argv = require('minimist')(process.argv.slice(2));
const AUTO = argv.auto || false;
const DRY = argv['dry-run'] || false;
const LIMIT = Number(argv.limit || 100);
const CSV_PATH = argv['export-csv'] || null;

async function fetchOrphans(limit = 100) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, analysis, model_version, analyzed_at, created_at FROM image_analyses WHERE image_id IS NULL ORDER BY created_at DESC LIMIT $1', [limit]);
    return res.rows;
  } finally {
    client.release();
  }
}

async function findByPHash(p_hash) {
  if (!p_hash) return null;
  const client = await pool.connect();
  try {
    // look for other analyses that have the same p_hash and already linked to an image
    const res = await client.query("SELECT DISTINCT image_id FROM image_analyses WHERE (analysis->>'p_hash') = $1 AND image_id IS NOT NULL LIMIT 1", [p_hash]);
    if (res.rowCount === 0) return null;
    return res.rows[0].image_id;
  } finally {
    client.release();
  }
}

async function findByUrlHeuristic(ocrText) {
  if (!ocrText) return null;
  // pick some candidate words to search images.url
  const words = (ocrText || '').replace(/[^\w\s]/g,' ').split(/\s+/).filter(w=>w.length>4).slice(0,5);
  if (!words.length) return null;
  const client = await pool.connect();
  try {
    // build ILIKE conditions
    const patterns = words.map(w => `%${w.toLowerCase()}%`);
    const params = patterns.map((p,i)=>p);
    const placeholders = patterns.map((_,i) => `$${i+1}`).join(',');
    const query = `SELECT id, url FROM images WHERE LOWER(url) LIKE ANY (array[${placeholders}]) LIMIT 5`;
    const res = await client.query(query, params);
    if (res.rowCount === 1) return res.rows[0].id;
    // if multiple matches, return null (ambiguous)
    return null;
  } finally {
    client.release();
  }
}

async function linkAnalysis(analysisId, imageId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE image_analyses SET image_id = $1 WHERE id = $2', [imageId, analysisId]);
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function writeCSV(rows, dest) {
  const header = ['id','model_version','analyzed_at','created_at','p_hash','ocr_text','analysis_json'];
  const lines = [header.join(',')];
  for (const r of rows) {
    const p_hash = (r.analysis && r.analysis.p_hash) ? String(r.analysis.p_hash).replace(/\r?\n|,/g,' ') : '';
    const ocr = (r.analysis && r.analysis.ocr && r.analysis.ocr.text) ? String(r.analysis.ocr.text).replace(/\r?\n|,/g,' ') : '';
    const aj = JSON.stringify(r.analysis).replace(/\r?\n/g,' ');
    const line = [r.id, r.model_version || '', r.analyzed_at || '', r.created_at || '', p_hash, ocr, `"${aj.replace(/"/g,'""')}"`].join(',');
    lines.push(line);
  }
  fs.writeFileSync(dest, lines.join('\n'));
}

async function main() {
  const orphans = await fetchOrphans(LIMIT);
  console.log(`Found ${orphans.length} orphan image_analyses (image_id IS NULL)`);
  if (orphans.length === 0) {
    await pool.end();
    return;
  }

  const toCSV = [];

  for (const o of orphans) {
    const analysis = o.analysis || {};
    let linked = null;
    if (AUTO) {
      // attempt p_hash match first
      const p_hash = analysis.p_hash || (analysis.pHash) || null;
      if (p_hash) {
        const found = await findByPHash(p_hash);
        if (found) linked = { method: 'p_hash', image_id: found };
      }
      // try OCR URL heuristic
      if (!linked && analysis.ocr && analysis.ocr.text) {
        const found = await findByUrlHeuristic(analysis.ocr.text);
        if (found) linked = { method: 'ocr_url', image_id: found };
      }
      if (linked) {
        console.log(`Orphan ${o.id} -> linked to image ${linked.image_id} via ${linked.method}${DRY ? ' (dry-run)' : ''}`);
        if (!DRY) {
          await linkAnalysis(o.id, linked.image_id);
        }
        continue;
      }
    }

    // collect for CSV/export or manual review
    toCSV.push(o);
  }

  if (CSV_PATH && toCSV.length) {
    const out = path.resolve(process.cwd(), CSV_PATH);
    writeCSV(toCSV, out);
    console.log(`Exported ${toCSV.length} orphan analyses to ${out}`);
  } else if (!CSV_PATH) {
    console.log(`No CSV export requested. ${toCSV.length} orphan analyses remain for manual review.`);
  }

  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
