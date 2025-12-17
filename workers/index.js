#!/usr/bin/env node
// Workers entrypoint - launches discovery daemon
require('dotenv').config();
const discoveryDaemon = require('./discovery_daemon');

console.log('Starting RateYourBarber worker services...');
console.log('- Discovery daemon: polling discovery_jobs table');

// The discovery daemon exports a loop() function that runs indefinitely
// For now, we just require the module which will start if run as main
if (require.main === module) {
  console.log('Worker service started. Press Ctrl+C to stop.');
  // The discovery_daemon.js will handle its own execution when required as main
  require('./discovery_daemon');
}
