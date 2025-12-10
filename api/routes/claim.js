// TODO: implement claim endpoints for barbers
exports.handler = function (req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'claim endpoint stub' }));
};
