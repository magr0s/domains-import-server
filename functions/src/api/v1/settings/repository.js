const { Firestore } = require('firebase-nodejs-helpers')

const firestore = new Firestore()

class SettingsRepository {
  static create (params) {
    return firestore.create('settings', params)
  }

  static update (id, params) {
    return firestore.set(`settings/${id}`, params)
  }
}

module.exports = SettingsRepository
