const { Firestore } = require('firebase-nodejs-helpers')

const firestore = new Firestore()

class Repository {
  constructor (params) {
    const { path } = params

    this.path = path
  }

  list (conditions, orderBy, limit) {
    return firestore.list(this.path, { conditions, orderBy, limit})
      .then(({ docs }) => (
        docs.map((doc) => {
          const { id } = doc

          return Object.assign({ id }, doc.data())
        })
      ))
  }

  get (id) {
    return firestore.get(`${this.path}/${id}`)
      .then((doc) => {
        const { id } = doc

        return Object.assign({ id }, doc.data())
      })
  }

  create (params) {
    return firestore.create(this.path, params)
  }

  update (id, params) {
    return firestore.set(`${this.path}/${id}`, params)
  }
}

module.exports = Repository
