#!/usr/bin/env node
// Poll discovery_jobs table and process pending jobs by calling yelp_to_socials

const { pool } = require('../api/db');
const { run: yelpToSocialsRun } = require('./crawlers/yelp_to_socials');

async function fetchPending(limit = 5) {
  const res = await pool.query("SELECT * FROM discovery_jobs WHERE status='pending' ORDER BY created_at ASC LIMIT $1", [limit]);
  return res.rows || [];
}

async function markJobInProgress(id) {
  await pool.query('UPDATE discovery_jobs SET status=$1, attempts = attempts + 1, updated_at = now() WHERE id=$2', ['in_progress', id]);
}

async function markJobCompleted(id, result) {
  await pool.query('UPDATE discovery_jobs SET status=$1, result=$2, updated_at=now() WHERE id=$3', ['completed', result, id]);
}

async function markJobFailed(id, errorText) {
  await pool.query('UPDATE discovery_jobs SET status=$1, last_error=$2, updated_at=now() WHERE id=$3', ['failed', errorText, id]);
}

async function processJob(job) {
  console.log('Processing discovery job', job.id, job.shop_name || job.yelp_business_id);
  await markJobInProgress(job.id);
  try {
    // call yelp_to_socials.run with appropriate params
    const out = await yelpToSocialsRun({ yelpId: job.yelp_business_id || null, name: job.shop_name || null, location: job.location_text || null, dryRun: false });
    await markJobCompleted(job.id, out);
    // Trigger background image processing for any newly persisted images.
    // Spawn the image_processor in the background to process pending images.
    try {
      const { spawn } = require('child_process');
      const child = spawn(process.execPath, ['workers/image_processor.js', '--pending', '20'], {
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
      console.log('Spawned background image_processor for pending images');
    } catch (e) {
      console.warn('Failed to spawn image_processor:', e && e.message);
    }
    // If this job was linked to a search_query, persist results into search_queries.results for frontend polling
    try {
      if (job.search_query_id) {
        await pool.query('UPDATE search_queries SET results = $1, updated_at = now() WHERE id = $2', [out, job.search_query_id]);
      }
    } catch (e) {
      console.warn('Failed to update search_queries for job', job.id, e.message || e);
    }
    console.log('Job completed', job.id);
  } catch (e) {
    console.error('Job failed', job.id, e.message || e);
    await markJobFailed(job.id, String(e.message || e));
  }
}


async function loop() {
  while (true) {
    try {
      const jobs = await fetchPending(3);
      if (!jobs.length) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      for (const j of jobs) {
        await processJob(j);
      }
    } catch (e) {
      console.error('Discovery daemon error', e.message || e);
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
}

if (require.main === module) {
  loop().catch(e => { console.error('daemon fatal', e); process.exit(1); });
}
