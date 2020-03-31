const router = require('express').Router()
const settingsRoutes = require('./settings/routes')

router.use('/settings', settingsRoutes)

module.exports = router
