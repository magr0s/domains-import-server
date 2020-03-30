const functions = require('firebase-functions');
const Server = require('./src/server')

const server = new Server('./api')

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.api = functions.https.onRequest(server);
