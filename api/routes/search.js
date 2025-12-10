// TODO: implement search route
// This should read query params: query, lat, lng, radius_m, limit
// and return the contract defined in api/contracts/search.md

const http = require('http');

exports.handler = function (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify([]));
};
