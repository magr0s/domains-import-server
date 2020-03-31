const router = require('express').Router()
const SettingsController = require('./controller')

router.post('/', SettingsController.create)
router.put('/:id', SettingsController.update)

module.exports = router
