const DomainsImport = require('../../../libs/domainsImport')
const SettingsRepository = require('../settings/repository')

const settingsRepo = new SettingsRepository()

class DomainsController {
  static async import (req, res) {
    const {
      body: {
        name,
        hoster,
        settingsId
      }
    } = req

    if (
      !name ||
      !settingsId ||
      !hoster
    ) return res.status(400).send({ errorCode: 'domains/missing-fields' })

    try {
      const settings = await settingsRepo.get(settingsId)

      const domainsImport = new DomainsImport(hoster, settings)

      await domainsImport.load(name)

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }
}

module.exports = DomainsController
