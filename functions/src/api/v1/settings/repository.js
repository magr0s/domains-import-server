const { Firestore } = require('firebase-nodejs-helpers')

const firestore = new Firestore()

class SettingsRepository {
  static get (id) {
    return firestore.get(`settings/${id}`)
      .then(({ doc }) => {
        const { id } = doc

        return Object.assign({}, doc.data(), { id })
      })
  }

  static create (params) {
    return firestore.create('settings', params)
  }

  static update (id, params) {
    return firestore.set(`settings/${id}`, params)
  }
}

module.exports = SettingsRepository
