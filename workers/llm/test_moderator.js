/**
 * Test LLM Moderator
 * 
 * Tests spam detection, fake review detection, and coordinated attack patterns.
 */

const { moderateReview, detectCoordinatedAttack } = require('./moderator');
const logger = require('../../api/lib/logger');

// Test cases covering various spam/fake patterns
const testCases = [
  {
    name: 'Clean legitimate review',
    text: 'Great barber! He gave me a perfect fade and listened to exactly what I wanted. Clean shop, friendly staff. Will definitely come back.',
    expected: { is_spam: false, is_fake: false }
  },
  {
    name: 'Spam with external link',
    text: 'Best barber ever! Visit myshop.com for special discount! Call 555-1234 now!',
    expected: { is_spam: true }
  },
  {
    name: 'Fake generic review',
    text: 'Good barber.',
    expected: { is_fake: true }
  },
  {
    name: 'Promotional spam',
    text: 'Amazing service! Use promo code SAVE20 for 20% off your first visit! Limited time offer!',
    expected: { is_spam: true }
  },
  {
    name: 'Bot-like template review',
    text: 'Great service. Excellent barber. Highly recommend. 5 stars.',
    expected: { is_fake: true }
  },
  {
    name: 'Coordinated attack (all caps)',
    text: 'WORST BARBER EVER!!! RUINED MY HAIR!!! NEVER GO HERE!!! TERRIBLE!!!',
    expected: { is_attack: true }
  },
  {
    name: 'Inappropriate harassment',
    text: 'This barber is a fucking scammer. Total asshole. Should be shut down. Avoid at all costs you idiot.',
    expected: { is_inappropriate: true }
  },
  {
    name: 'Detailed authentic review',
    text: 'I\'ve been going to Marcus for about 6 months now. He\'s consistent with fades and listens to what you want. The shop is clean, wait times are reasonable (10-15 min), and he\'s good with conversation. Prices are fair at $35 for a cut. Only downside is parking can be tough on weekends.',
    expected: { is_spam: false, is_fake: false, is_attack: false }
  },
  {
    name: 'Mixed language (Spanish + English)',
    text: 'Excelente servicio! Very professional barber. Me encantó el corte. Highly recommend for anyone looking for quality haircuts.',
    expected: { is_spam: false, is_fake: false }
  },
  {
    name: 'AAVE authentic review',
    text: 'Yo this barber know what he doing fr fr. My lineup was crispy and he ain\'t take too long neither. Shop be bumping on Saturdays tho so get there early.',
    expected: { is_spam: false, is_fake: false }
  }
];

async function runModerationTests() {
  console.log('\n=== LLM Moderator Tests ===\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      console.log(`Text: "${testCase.text}"`);
      
      const result = await moderateReview(testCase.text, {
        barber_name: 'Test Barber',
        shop_name: 'Test Shop'
      });

      console.log(`Result: `, result);

      // Check expectations
      let testPassed = true;
      const failures = [];

      if (testCase.expected.is_spam !== undefined && result.is_spam !== testCase.expected.is_spam) {
        testPassed = false;
        failures.push(`is_spam: expected ${testCase.expected.is_spam}, got ${result.is_spam}`);
      }

      if (testCase.expected.is_fake !== undefined && result.is_fake !== testCase.expected.is_fake) {
        testPassed = false;
        failures.push(`is_fake: expected ${testCase.expected.is_fake}, got ${result.is_fake}`);
      }

      if (testCase.expected.is_attack !== undefined && result.is_attack !== testCase.expected.is_attack) {
        testPassed = false;
        failures.push(`is_attack: expected ${testCase.expected.is_attack}, got ${result.is_attack}`);
      }

      if (testCase.expected.is_inappropriate !== undefined && result.is_inappropriate !== testCase.expected.is_inappropriate) {
        testPassed = false;
        failures.push(`is_inappropriate: expected ${testCase.expected.is_inappropriate}, got ${result.is_inappropriate}`);
      }

      if (testPassed) {
        console.log('✅ PASS\n');
        passed++;
      } else {
        console.log(`❌ FAIL: ${failures.join(', ')}\n`);
        failed++;
      }

      results.push({
        name: testCase.name,
        passed: testPassed,
        result,
        failures
      });

      // Rate limit between tests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ ERROR: ${error.message}\n`);
      failed++;
      results.push({
        name: testCase.name,
        passed: false,
        error: error.message
      });
    }
  }

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Passed: ${passed}/${testCases.length}`);
  console.log(`Failed: ${failed}/${testCases.length}`);
  console.log(`Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%`);

  // Show failed tests
  if (failed > 0) {
    console.log('\n=== Failed Tests ===');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`- ${r.name}`);
        if (r.failures) {
          r.failures.forEach(f => console.log(`  ${f}`));
        }
        if (r.error) {
          console.log(`  Error: ${r.error}`);
        }
      });
  }

  return { passed, failed, total: testCases.length, results };
}

async function testCoordinatedAttack() {
  console.log('\n=== Coordinated Attack Detection Test ===\n');
  
  // This would need a test database with seeded reviews
  // For now, just demonstrate the API
  console.log('Coordinated attack detection requires database setup.');
  console.log('Example usage:');
  console.log('  const result = await detectCoordinatedAttack(barberId, "barber", 86400);');
  console.log('  console.log(result.is_attack, result.confidence, result.reason);');
}

// Run tests
(async () => {
  try {
    const { passed, failed, total } = await runModerationTests();
    await testCoordinatedAttack();
    
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
})();
