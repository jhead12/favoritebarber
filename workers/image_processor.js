#!/usr/bin/env node
/*
 Image processor worker (Node)
 - Uses Google Cloud Vision if credentials are available
 - Falls back to a local heuristic analyzer (safe to run offline)
 - Persists analysis to `image_analyses` and updates `images` scores
 */

let pool = null;
try {
  const db = require('../api/db');
  pool = db.pool;
} catch (e) {
  console.warn('Database client not available; running in offline/simulate mode');
  pool = null;
}
const { execSync } = require('child_process');

let useGoogleVision = false;
try {
  // If GOOGLE_APPLICATION_CREDENTIALS is set or gcloud is configured, attempt to use Google Vision
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCLOUD_PROJECT) {
    useGoogleVision = true;
  }
} catch (e) {
  useGoogleVision = false;
}

let visionClient = null;
if (useGoogleVision) {
  try {
    const vision = require('@google-cloud/vision');
    visionClient = new vision.ImageAnnotatorClient();
    console.log('Using Google Vision API for image analysis');
  } catch (err) {
    console.warn('Google Vision SDK not installed or failed to load; falling back to local analyzer');
    useGoogleVision = false;
  }
}

async function analyzeWithGoogle(url) {
  // Calls label, text, face, and safeSearch detection
  const [labelRes] = await visionClient.labelDetection(url);
  const [textRes] = await visionClient.textDetection(url);
  const [faceRes] = await visionClient.faceDetection(url);
  const [safeRes] = await visionClient.safeSearchDetection(url);

  const labels = (labelRes.labelAnnotations || []).map(l => ({ description: l.description, score: l.score }));
  const texts = (textRes.textAnnotations || []).map(t => t.description).join('\n');
  const faces = (faceRes.faceAnnotations || []).map(f => ({ detectionConfidence: f.detectionConfidence || 0 }));
  const safe = (safeRes.safeSearchAnnotation) || {};

  return { labels, texts, faces, safe };
}

function heuristicAnalyze(url, source) {
  const lower = (url || '').toLowerCase();
  // Give higher provenance to images pulled from social media (more likely user-generated)
  const provenance_score = source === 'social' ? 0.5 : (source === 'yelp' ? 0.25 : 0.05);
  const analysis = { provenance_score, objects: {}, faces: { count: 0, score: 0 }, ocr: { text: null, score: 0 }, p_hash: `phash-${Math.random().toString(36).slice(2,9)}` };
  if (lower.includes('barber') || lower.includes('hair') || lower.includes('shop')) {
    analysis.objects.barber_chair = 0.9;
    analysis.objects.scissors = 0.3;
    analysis.faces = { count: 1, score: 0.12 };
  } else if (lower.includes('landscape') || lower.includes('mountain')) {
    analysis.objects.landscape = 0.95;
  } else {
    analysis.objects.unknown = 0.1;
  }
  const object_score = Math.min(1, Object.values(analysis.objects).reduce((a,b)=>a+b,0));
  const face_score = analysis.faces.score || 0;
  const provenance = analysis.provenance_score;
  const uniqueness = 0.05;
  const relevance = Math.min(1, object_score * 0.6 + face_score * 0.15 + provenance * 0.15 + uniqueness * 0.1);
  const authenticity = Math.min(1, relevance * (1 + provenance));
  return { analysis, relevance_score: Number(relevance.toFixed(3)), authenticity_score: Number(authenticity.toFixed(3)) };
}

async function persistAnalysis(imageId, rawAnalysis, relevance_score, authenticity_score, hairstyles = []) {
  // If there's no DB pool available, or this is a sample run using
  // non-integer IDs (e.g. 'img1'), treat it as a simulation and
  // avoid performing any writes. This prevents type errors when
  // sample data uses string IDs while the DB expects integer keys.
  if (!pool || typeof imageId !== 'number') {
    console.log('(SIM) Persisting analysis for', imageId, 'relevance=', relevance_score, 'authenticity=', authenticity_score);
    console.log('(SIM) analysis:', JSON.stringify(rawAnalysis && (rawAnalysis.labels || rawAnalysis.objects || rawAnalysis), null, 2));
    console.log('(SIM) hairstyles:', JSON.stringify(hairstyles));
    return;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertText = `INSERT INTO image_analyses (image_id, analysis, relevance_score, authenticity_score, model_version, analyzed_at, created_at) VALUES ($1,$2,$3,$4,$5,now(),now()) RETURNING id`;
    await client.query(insertText, [imageId, rawAnalysis, relevance_score, authenticity_score, 'v1-local']);
    const updateText = `UPDATE images SET relevance_score = $1, authenticity_score = $2, hairstyles = $3 WHERE id = $4`;
    await client.query(updateText, [relevance_score, authenticity_score, JSON.stringify(hairstyles), imageId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function analyzeAndPersist(image) {
  console.log('Processing image', image.id, image.url);
  let result;
  if (useGoogleVision) {
    try {
      const gv = await analyzeWithGoogle(image.url);
      // Map Google results into our analysis shape
      // Boost provenance if the image is from social media sources
      const provenance_score = image.source === 'social' ? 0.5 : (image.source === 'yelp' ? 0.25 : 0.05);
      const analysis = {
        provenance_score,
        labels: gv.labels,
        ocr: { text: gv.texts, score: gv.texts ? 0.1 : 0 },
        faces: { count: gv.faces.length, score: (gv.faces[0] && gv.faces[0].detectionConfidence) || 0 },
        safe: gv.safe
      };
      // detect hairstyles from labels / ocr
      const hairstyles = detectHairstylesFromAnalysis(analysis);
      // derive simple scores
      const object_score = Math.min(1, (analysis.labels || []).slice(0,5).reduce((s,l)=>s+(l.score||0),0));
      const face_score = analysis.faces.score || 0;
      const provenance = analysis.provenance_score;
      const uniqueness = 0.05;
      const relevance = Math.min(1, object_score * 0.6 + face_score * 0.15 + provenance * 0.15 + uniqueness * 0.1);
      const authenticity = Math.min(1, relevance * (1 + provenance));
      result = { analysis, relevance_score: Number(relevance.toFixed(3)), authenticity_score: Number(authenticity.toFixed(3)), hairstyles };
    } catch (err) {
      console.warn('Google Vision call failed, falling back to heuristic:', err.message);
      result = heuristicAnalyze(image.url, image.source);
    }
  } else {
    result = heuristicAnalyze(image.url, image.source);
  }

  // persist
  await persistAnalysis(image.id, result.analysis, result.relevance_score, result.authenticity_score, result.hairstyles || []);
  console.log('Persisted analysis for', image.id, 'relevance=', result.relevance_score);
}

/**
 * Detect probable hairstyles from analysis labels/text
 * Returns an array of canonical hairstyle strings (no duplicates)
 * Based on canonical vocabulary from docs/HAIRSTYLES.md
 */
function detectHairstylesFromAnalysis(analysis) {
  const candidates = new Set();
  const textSources = [];
  if (analysis.labels && Array.isArray(analysis.labels)) {
    textSources.push(...analysis.labels.map(l=>l.description));
  }
  if (analysis.ocr && analysis.ocr.text) textSources.push(analysis.ocr.text);
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

  for (const [canonical, keys] of Object.entries(mapping)) {
    for (const k of keys) {
      if (joined.includes(k)) {
        candidates.add(canonical);
        break;
      }
    }
  }

  return Array.from(candidates);
}

async function processSample() {
  const SAMPLE = [
    { id: 'img1', url: 'https://s3.example.com/uploads/barber-shop-1.jpg', source: 'yelp' },
    { id: 'img2', url: 'https://example.com/photos/landscape.jpg', source: 'scraped' },
    // Social media sample image — provenance boosted and analyzed
    { id: 'img3', url: 'https://social.example.com/instagram/barber1.jpg', source: 'social' }
  ];
  for (const img of SAMPLE) {
    try {
      await analyzeAndPersist(img);
    } catch (err) {
      console.error('Failed to analyze', img.id, err.message);
    }
  }
}

async function processPending(limit = 50) {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, url, source FROM images WHERE COALESCE(relevance_score,0) = 0 LIMIT $1', [limit]);
    for (const row of res.rows) {
      try {
        await analyzeAndPersist(row);
      } catch (err) {
        console.error('Error processing image', row.id, err.message);
      }
    }
  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--sample')) {
    await processSample();
    process.exit(0);
  }
  if (args.includes('--pending')) {
    const i = args.indexOf('--pending');
    const limit = i >= 0 && args[i+1] ? Number(args[i+1]) : 50;
    await processPending(limit);
    process.exit(0);
  }
  console.log('Usage: node workers/image_processor.js --sample | --pending [limit]');
  process.exit(0);
}

if (require.main === module) main().catch(err=>{console.error(err); process.exit(1)});
