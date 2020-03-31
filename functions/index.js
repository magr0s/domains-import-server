const functions = require('firebase-functions');

const { FirebaseAdmin } = require('firebase-nodejs-helpers')
const config = require(`./src/configs/${process.env.GCLOUD_PROJECT}.service-key.json`)

FirebaseAdmin.init({ config })

const Server = require('./src/server')

const server = new Server('./api')

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.api = functions.https.onRequest(server);
