const SettingsRepository = require('./repository')

const settingsRepo = new SettingsRepository()

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
      proxyLogin,
      proxyPassword,
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
      !proxyURL ||
      !proxyLogin ||
      !proxyPassword
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await settingsRepo.create(body)

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
      proxyLogin,
      proxyPassword,
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
      !proxyURL ||
      !proxyLogin ||
      !proxyPassword
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await settingsRepo.update(id, body)

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }
}

module.exports = SettingsController
