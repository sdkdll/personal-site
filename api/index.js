// Serverless entry. Same app as server/app.js, but without the listener.

const app = require('../server/app.js');

module.exports = app;
