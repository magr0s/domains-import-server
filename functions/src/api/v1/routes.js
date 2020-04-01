const router = require('express').Router()
const settingsRoutes = require('./settings/routes')
const domainsRoutes = require('./domains/routes')

router.use('/settings', settingsRoutes)
router.use('/domains', domainsRoutes)

module.exports = router
