#!/usr/bin/env node
/*
 Hairstyle Vision Test Suite
 
 Purpose:
 - Test hairstyle detection from image analysis (labels/OCR)
 - Validate mapping to canonical hairstyles from docs/HAIRSTYLES.md
 - Test association of hairstyles with barbers and shops
 
 Usage:
   node workers/test_hairstyle_vision.js
   node workers/test_hairstyle_vision.js --db  (test against real database images)
*/

// Import the detection function from image_processor
const { detectHairstylesFromAnalysis } = require('./image_processor_test_exports');

// Test cases: simulate Google Vision / OCR outputs
const TEST_CASES = [
  {
    name: 'Fade detection from labels',
    analysis: {
      labels: [
        { description: 'Hair', score: 0.95 },
        { description: 'Fade haircut', score: 0.88 },
        { description: 'Barber', score: 0.75 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['fade']
  },
  {
    name: 'Multiple styles from labels (fade + undercut)',
    analysis: {
      labels: [
        { description: 'Undercut', score: 0.90 },
        { description: 'Low fade', score: 0.85 },
        { description: 'Modern haircut', score: 0.70 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['fade', 'undercut']
  },
  {
    name: 'Buzz cut from OCR text',
    analysis: {
      labels: [
        { description: 'Hair', score: 0.80 }
      ],
      ocr: { text: 'Menu: Buzz Cut $25, Fade $30', score: 0.2 }
    },
    expected: ['buzz cut', 'fade']
  },
  {
    name: 'Pompadour and beard trim',
    analysis: {
      labels: [
        { description: 'Pompadour', score: 0.92 },
        { description: 'Beard', score: 0.80 },
        { description: 'Facial hair', score: 0.75 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['pompadour', 'beard trim']
  },
  {
    name: 'Mohawk from text',
    analysis: {
      labels: [],
      ocr: { text: 'Check out this sick mohawk I got today!', score: 0.15 }
    },
    expected: ['mohawk']
  },
  {
    name: 'Crew cut synonym detection',
    analysis: {
      labels: [
        { description: 'Crew cut', score: 0.88 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['crew cut']
  },
  {
    name: 'Taper fade - should detect both fade and taper',
    analysis: {
      labels: [
        { description: 'Taper fade', score: 0.90 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['fade', 'taper'] // 'taper fade' matches both canonical styles
  },
  {
    name: 'Man bun and top knot',
    analysis: {
      labels: [
        { description: 'Man bun', score: 0.85 },
        { description: 'Long hair', score: 0.70 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['man bun', 'long layered']
  },
  {
    name: 'Scissor cut from label',
    analysis: {
      labels: [
        { description: 'Scissors', score: 0.75 },
        { description: 'Haircut', score: 0.90 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['scissor cut']
  },
  {
    name: 'No hairstyle detected',
    analysis: {
      labels: [
        { description: 'Building', score: 0.90 },
        { description: 'Architecture', score: 0.85 }
      ],
      ocr: { text: 'Barber Shop Sign', score: 0.1 }
    },
    expected: []
  },
  {
    name: 'Complex OCR with multiple styles',
    analysis: {
      labels: [],
      ocr: { 
        text: 'SERVICES: Fade $30, Undercut $35, Buzz Cut $20, Beard Trim $15',
        score: 0.25 
      }
    },
    expected: ['fade', 'undercut', 'buzz cut', 'beard trim']
  },
  {
    name: 'High fade synonym',
    analysis: {
      labels: [
        { description: 'High fade', score: 0.92 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['fade']
  },
  {
    name: 'Skin fade synonym',
    analysis: {
      labels: [
        { description: 'Skin fade', score: 0.88 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['fade']
  },
  {
    name: 'Layered hair detection',
    analysis: {
      labels: [
        { description: 'Layered hair', score: 0.85 },
        { description: 'Long hair', score: 0.80 }
      ],
      ocr: { text: null, score: 0 }
    },
    expected: ['long layered']
  }
];

// Run unit tests
function runUnitTests() {
  console.log('='.repeat(60));
  console.log('HAIRSTYLE VISION TEST SUITE');
  console.log('='.repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;
  const failures = [];

  for (const testCase of TEST_CASES) {
    const result = detectHairstylesFromAnalysis(testCase.analysis);
    const resultSet = new Set(result);
    const expectedSet = new Set(testCase.expected);
    
    const isMatch = 
      resultSet.size === expectedSet.size &&
      [...resultSet].every(item => expectedSet.has(item));

    if (isMatch) {
      passed++;
      console.log(`✓ ${testCase.name}`);
      console.log(`  Detected: [${result.join(', ')}]`);
    } else {
      failed++;
      console.log(`✗ ${testCase.name}`);
      console.log(`  Expected: [${testCase.expected.join(', ')}]`);
      console.log(`  Got:      [${result.join(', ')}]`);
      failures.push({
        name: testCase.name,
        expected: testCase.expected,
        got: result
      });
    }
    console.log();
  }

  console.log('='.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));
  console.log();

  if (failures.length > 0) {
    console.log('FAILED TESTS:');
    failures.forEach(f => {
      console.log(`  - ${f.name}`);
      console.log(`    Expected: ${JSON.stringify(f.expected)}`);
      console.log(`    Got:      ${JSON.stringify(f.got)}`);
    });
    console.log();
  }

  return { passed, failed, failures };
}

// Test against real database images
async function testDatabaseImages() {
  console.log('='.repeat(60));
  console.log('DATABASE IMAGE HAIRSTYLE TEST');
  console.log('='.repeat(60));
  console.log();

  let pool;
  try {
    const db = require('../api/db');
    pool = db.pool;
  } catch (e) {
    console.error('Cannot load database client. Make sure PostgreSQL is running.');
    return;
  }

  const client = await pool.connect();
  try {
    // Get images with analyses
    const res = await client.query(`
      SELECT 
        i.id,
        i.url,
        i.source,
        i.hairstyles,
        ia.analysis
      FROM images i
      LEFT JOIN image_analyses ia ON ia.image_id = i.id
      WHERE ia.analysis IS NOT NULL
      ORDER BY i.id
      LIMIT 20
    `);

    console.log(`Found ${res.rows.length} images with analyses\n`);

    for (const row of res.rows) {
      const detectedStyles = row.hairstyles || [];
      const recomputed = detectHairstylesFromAnalysis(row.analysis);
      
      console.log(`Image ${row.id}: ${row.url}`);
      console.log(`  Source: ${row.source}`);
      console.log(`  Stored hairstyles: [${detectedStyles.join(', ')}]`);
      console.log(`  Recomputed: [${recomputed.join(', ')}]`);
      
      if (JSON.stringify(detectedStyles.sort()) !== JSON.stringify(recomputed.sort())) {
        console.log(`  ⚠️  MISMATCH - Consider reprocessing`);
      }
      console.log();
    }

    // Summary by hairstyle
    const styleRes = await client.query(`
      SELECT 
        jsonb_array_elements_text(hairstyles) as style,
        COUNT(*) as count
      FROM images
      WHERE hairstyles IS NOT NULL AND jsonb_array_length(hairstyles) > 0
      GROUP BY style
      ORDER BY count DESC
    `);

    console.log('HAIRSTYLE FREQUENCY:');
    for (const row of styleRes.rows) {
      console.log(`  ${row.style}: ${row.count} images`);
    }
    console.log();

  } finally {
    client.release();
  }
}

// Test barber/shop associations
async function testBarberShopAssociations() {
  console.log('='.repeat(60));
  console.log('BARBER/SHOP HAIRSTYLE ASSOCIATIONS');
  console.log('='.repeat(60));
  console.log();

  let pool;
  try {
    const db = require('../api/db');
    pool = db.pool;
  } catch (e) {
    console.error('Cannot load database client.');
    return;
  }

  const client = await pool.connect();
  try {
    // Get hairstyles associated with each barber (via their images)
    const barberRes = await client.query(`
      SELECT 
        b.id,
        b.name,
        array_agg(DISTINCT style) FILTER (WHERE style IS NOT NULL) as hairstyles
      FROM barbers b
      LEFT JOIN images i ON i.barber_id = b.id
      LEFT JOIN LATERAL jsonb_array_elements_text(i.hairstyles) AS style ON true
      WHERE b.name IS NOT NULL
      GROUP BY b.id, b.name
      HAVING array_agg(DISTINCT style) FILTER (WHERE style IS NOT NULL) IS NOT NULL
      ORDER BY b.name
      LIMIT 20
    `);

    console.log(`BARBERS WITH HAIRSTYLE DATA (${barberRes.rows.length}):\n`);
    for (const row of barberRes.rows) {
      console.log(`${row.name} (ID: ${row.id})`);
      console.log(`  Hairstyles: ${row.hairstyles.join(', ')}`);
      console.log();
    }

    // Get hairstyles associated with each shop
    const shopRes = await client.query(`
      SELECT 
        s.id,
        s.name,
        array_agg(DISTINCT style) FILTER (WHERE style IS NOT NULL) as hairstyles
      FROM shops s
      LEFT JOIN shop_barbers sb ON sb.shop_id = s.id
      LEFT JOIN barbers b ON b.id = sb.barber_id
      LEFT JOIN images i ON i.barber_id = b.id OR i.shop_id = s.id
      LEFT JOIN LATERAL jsonb_array_elements_text(i.hairstyles) AS style ON true
      WHERE s.name IS NOT NULL
      GROUP BY s.id, s.name
      HAVING array_agg(DISTINCT style) FILTER (WHERE style IS NOT NULL) IS NOT NULL
      ORDER BY s.name
      LIMIT 20
    `);

    console.log(`\nSHOPS WITH HAIRSTYLE DATA (${shopRes.rows.length}):\n`);
    for (const row of shopRes.rows) {
      console.log(`${row.name} (ID: ${row.id})`);
      console.log(`  Hairstyles: ${row.hairstyles.join(', ')}`);
      console.log();
    }

  } finally {
    client.release();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--db')) {
    // Test against database
    await testDatabaseImages();
    console.log();
    await testBarberShopAssociations();
  } else {
    // Run unit tests
    const results = runUnitTests();
    
    if (results.failed > 0) {
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('Test error:', err);
    process.exit(1);
  });
}

module.exports = { runUnitTests, testDatabaseImages, testBarberShopAssociations };
