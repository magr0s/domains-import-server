const Repository = require('../../../libs/repository');

const settingsRepo = new Repository('settings');

class SettingsController {
  static async create (req, res) {
    const {
      body
    } = req

    const {
      begetLogin,
      begetPassword,
      dreamhostLogin,
      dreamhostPassword,
      serverIP,
      stackpathId,
      stackpathSecret,
      ispManagerURL,
      ispManagerLogin,
      ispManagerPassword,
      proxyURL
    } = body

    if (
      !begetLogin ||
      !begetPassword ||
      !dreamhostLogin ||
      !dreamhostPassword ||
      !serverIP ||
      !stackpathId ||
      !stackpathSecret ||
      !ispManagerURL ||
      !ispManagerLogin ||
      !ispManagerPassword ||
      !proxyURL
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await settingsRepo.create(Object.assign({
        proxyLogin: '',
        proxyPassword: ''
      }, body))

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }

  static async update (req, res) {
    const {
      params: { id },
      body
    } = req

    const {
      begetLogin,
      begetPassword,
      dreamhostLogin,
      dreamhostPassword,
      serverIP,
      stackpathId,
      stackpathSecret,
      ispManagerURL,
      ispManagerLogin,
      ispManagerPassword,
      proxyURL
    } = body

    if (!id) return res.status(400).send({ errorCode: 'settings/bad-id' })

    if (
      !begetLogin ||
      !begetPassword ||
      !dreamhostLogin ||
      !dreamhostPassword ||
      !serverIP ||
      !stackpathId ||
      !stackpathSecret ||
      !ispManagerURL ||
      !ispManagerLogin ||
      !ispManagerPassword ||
      !proxyURL
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await settingsRepo.update(id, Object.assign({
        proxyLogin: '',
        proxyPassword: ''
      }, body))

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }
}

module.exports = SettingsController
