const SettingsRepository = require('./repository')

class SettingsController {
  static async create (req, res) {
    const {
      body
    } = req

    const {
      begetLogin,
      begetPassword,
      serverIP,
      stackpathSecret,
      ispManagerURL,
      ispManagerLogin,
      ispManagerPassword
    } = body

    if (
      !begetLogin ||
      !begetPassword ||
      !serverIP ||
      !stackpathSecret ||
      !ispManagerURL ||
      !ispManagerLogin ||
      !ispManagerPassword
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await SettingsRepository.create(body)

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
      stackpathToken,
      ispManagerURL,
      ispManagerLogin,
      ispManagerPassword
    } = body

    if (!id) return res.status(400).send({ errorCode: 'settings/bad-id' })

    if (
      !begetLogin ||
      !begetPassword ||
      !stackpathToken ||
      !ispManagerURL ||
      !ispManagerLogin ||
      !ispManagerPassword
    ) {
      return res.status(400).send({ errorCode: 'settings/missing-fields' })
    }

    try {
      await SettingsRepository.set(id, body)

      return res.status(200).send({ success: true })
    } catch ({ message }) {
      return res.status(500).send({ error: message })
    }
  }
}

module.exports = SettingsController
