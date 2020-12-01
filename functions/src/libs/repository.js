const { AbstractStore } = require('firebase-nodejs-helpers');

class Repository extends AbstractStore {
  constructor(path) {
    super(path);
  }
}

module.exports = Repository;
