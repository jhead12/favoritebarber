const { queryYelpGraphql } = require('./yelp_graphql');
require('dotenv').config();

async function main() {
  if (!process.env.YELP_API_KEY) {
    console.error('YELP_API_KEY not set. Set it and re-run. Example:');
    console.error("export YELP_API_KEY=\"YOUR_TOKEN_HERE\"");
    console.error('\nOr run a raw curl as in the README:');
    console.error("curl -X POST -H \"Authorization: Bearer ACCESS_TOKEN\" -H \"Content-Type: application/graphql\" https://api.yelp.com/v3/graphql --data '\\n{\n    business(id: \"garaje-san-francisco\") {\n        name\n        id\n        alias\n        rating\n        url\n    }\n}'");
    process.exit(1);
  }

  const query = `
{
    business(id: "garaje-san-francisco") {
        name
        id
        alias
        rating
        url
    }
}
`;

  try {
    const resp = await queryYelpGraphql(query);
    console.log('GraphQL response:');
    console.log(JSON.stringify(resp, null, 2));
  } catch (err) {
    console.error('GraphQL request failed:');
    console.error(err.message || err);
    process.exit(2);
  }
}

if (require.main === module) main();
