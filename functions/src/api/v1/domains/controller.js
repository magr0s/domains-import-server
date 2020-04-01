const DomainsImport = require('../../../libs/domainsImport')
const Settings = require('../settings/repository')

class DomainsController {
  static async import (req, res) {
    const {
      body: {
        name = 'fortnitelib.ru',
        settingsId
      }
    } = req

    if (!name || !settingsId) return res.status(400).send({ errorCode: 'domains/missing-fields' })

    try {
      const settings = await Settings.get(settingsId)

      const domainsImport = new DomainsImport(settings)

      await domainsImport.load(name)

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }
}

module.exports = DomainsController
