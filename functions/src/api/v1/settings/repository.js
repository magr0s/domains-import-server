const Repository = require('../../../libs/repository')

class SettingsRepository extends Repository {
  constructor() {
    const options = {
      path: 'settings'
    }

    super(options)
  }
}

module.exports = SettingsRepository
