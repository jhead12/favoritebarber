// Manual test script to exercise acquireYelpToken and getYelpUsage
// Run: node tests/test_acquire_yelp_token.js

const { acquireYelpToken, getYelpUsage } = require('../api/lib/mcpRateLimiter');

(async () => {
  console.log('Starting acquireYelpToken manual test (accountId: test)');
  for (let i = 1; i <= 20; i++) {
    try {
      const r = await acquireYelpToken({ accountId: 'test', cost: 1 });
      console.log(`#${i}`, r);
      if (!r.ok) {
        console.log('Quota exceeded at iteration', i);
        break;
      }
    } catch (e) {
      console.error('Error acquiring token:', e);
      break;
    }
  }

  const usage = await getYelpUsage('test');
  console.log('Final usage:', usage);
})();
