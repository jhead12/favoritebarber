/**
 * workers/scripts/enrichment_status.js
 * 
 * Display enrichment status across all reviews and providers.
 * Usage: npm run enrich:status
 */

require('dotenv').config({ path: '.env' });
const { Pool } = require('pg');

const db = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/rateyourbarber'
});

async function getEnrichmentStats() {
  // Total reviews
  const totalQuery = `SELECT COUNT(*) as count FROM reviews WHERE text IS NOT NULL AND text != ''`;
  const totalRes = await db.query(totalQuery);
  const total = parseInt(totalRes.rows[0].count, 10);

  // Enriched reviews
  const enrichedQuery = `SELECT COUNT(*) as count FROM reviews WHERE enriched_at IS NOT NULL`;
  const enrichedRes = await db.query(enrichedQuery);
  const enriched = parseInt(enrichedRes.rows[0].count, 10);

  // Pending reviews
  const pending = total - enriched;

  // By provider
  const providerQuery = `
    SELECT 
      COALESCE(enriched_provider, 'none') as provider,
      COALESCE(enriched_model, 'unknown') as model,
      COUNT(*) as count
    FROM reviews
    WHERE enriched_at IS NOT NULL
    GROUP BY enriched_provider, enriched_model
    ORDER BY count DESC
  `;
  const providerRes = await db.query(providerQuery);
  const byProvider = providerRes.rows;

  // Average enrichment age
  const ageQuery = `
    SELECT 
      EXTRACT(EPOCH FROM AVG(NOW() - enriched_at))/86400 as avg_age_days,
      EXTRACT(EPOCH FROM MAX(NOW() - created_at))/86400 as oldest_unenriched_days
    FROM reviews
    WHERE enriched_at IS NOT NULL
  `;
  const ageRes = await db.query(ageQuery);
  const avgAge = parseFloat(ageRes.rows[0].avg_age_days || 0);

  // Oldest unenriched review
  const oldestQuery = `
    SELECT EXTRACT(EPOCH FROM MAX(NOW() - created_at))/86400 as days
    FROM reviews
    WHERE enriched_at IS NULL AND text IS NOT NULL AND text != ''
  `;
  const oldestRes = await db.query(oldestQuery);
  const oldestUnenriched = parseFloat(oldestRes.rows[0].days || 0);

  return {
    total,
    enriched,
    pending,
    byProvider,
    avgAge,
    oldestUnenriched
  };
}

function formatNumber(num) {
  return num.toLocaleString();
}

function formatPercent(num, total) {
  if (total === 0) return '0.0%';
  return ((num / total) * 100).toFixed(1) + '%';
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        Review Enrichment Status                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  try {
    const stats = await getEnrichmentStats();

    console.log(`Total Reviews:           ${formatNumber(stats.total)}`);
    console.log(`Enriched:                ${formatNumber(stats.enriched)} (${formatPercent(stats.enriched, stats.total)})`);
    console.log(`Pending:                 ${formatNumber(stats.pending)} (${formatPercent(stats.pending, stats.total)})`);
    console.log('');

    if (stats.byProvider.length > 0) {
      console.log('By Provider:');
      for (const p of stats.byProvider) {
        const providerLabel = p.provider === 'none' ? 'heuristic/fallback' : `${p.provider} (${p.model})`;
        const count = parseInt(p.count, 10);
        const pct = formatPercent(count, stats.enriched);
        console.log(`  ${providerLabel.padEnd(35)} ${formatNumber(count).padStart(8)} (${pct.padStart(6)})`);
      }
      console.log('');
    }

    if (stats.enriched > 0) {
      console.log(`Average Enrichment Age:  ${stats.avgAge.toFixed(1)} days`);
    }
    
    if (stats.pending > 0 && stats.oldestUnenriched > 0) {
      console.log(`Oldest Unenriched:       ${stats.oldestUnenriched.toFixed(1)} days ago`);
    }

    console.log('');

    if (stats.pending > 0) {
      console.log('💡 Run enrichment with:');
      console.log('   npm run enrich              # Process pending reviews');
      console.log('   npm run enrich:sample       # Test with sample data');
    } else {
      console.log('✅ All reviews are enriched!');
    }

    console.log('');
  } catch (err) {
    console.error('Error fetching enrichment stats:', err.message);
    process.exit(1);
  } finally {
    await db.end();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { getEnrichmentStats };
