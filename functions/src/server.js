const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

class Server {
  constructor (entry) {
    if (typeof (entry) !== 'string' || !entry) {
      throw new Error('Entry point can`t be empty.')
    }

    this.app = express()

    this.app.use(bodyParser.json())
      .use(cors({ origin: true }))
      .use('/', require(entry))
      .get('*', (_, res) => (
        res.status(404)
          .json({
            success: false,
            data: 'Error: Endpoint not found.'
          })
      ))

    return this.app
  }
}

module.exports = Server
