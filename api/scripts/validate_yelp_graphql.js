#!/usr/bin/env node
require('dotenv').config();
const { queryYelpGraphql } = require('../yelp_graphql');

async function main() {
  if (!process.env.YELP_API_KEY) {
    console.log('YELP_API_KEY is not set. To validate GraphQL, set YELP_API_KEY in your environment.');
    console.log('Example: YELP_API_KEY=your_key node api/scripts/validate_yelp_graphql.js <business_id>');
    process.exit(0);
  }
  const businessId = process.argv[2] || process.env.YELP_SAMPLE_BUSINESS_ID;
  if (!businessId) {
    console.error('Provide a business id as the first arg or set YELP_SAMPLE_BUSINESS_ID');
    process.exit(2);
  }
  const query = `{
  business(id: "${String(businessId).replace(/"/g,'\\"')}") {
    id
    name
    rating
    photos
    categories { title }
    location { address1 city state postal_code }
    hours { open { day start end is_overnight } }
  }
}`;
  try {
    const res = await queryYelpGraphql(query, { cost: 1 });
    console.log('GraphQL response:');
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error('GraphQL validation failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
}

if (require.main === module) main();
