const assert = require('assert');
const fixture = require('../fixtures/yelp_graphql/garaje-san-francisco.json');
const { mapGraphqlBusiness } = require('../../api/lib/yelp_normalize');

function run() {
  const b = fixture.data && fixture.data.business;
  assert(b, 'fixture missing business');
  const mapped = mapGraphqlBusiness(b);
  // basic shape assertions
  assert.strictEqual(mapped.id, b.id, 'id should match');
  assert.strictEqual(mapped.name, b.name, 'name should match');
  assert.strictEqual(mapped.yelp_url, b.url || null);
  assert.strictEqual(typeof mapped.rating, 'number');
  assert.ok(mapped.address !== undefined, 'address should be present (may be empty string)');
  console.log('Yelp GraphQL mapping test: OK');
}

if (require.main === module) run();

module.exports = run;
