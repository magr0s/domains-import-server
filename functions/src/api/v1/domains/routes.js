const router = require('express').Router()
const DomainsController = require('./controller')

router.post('/import', DomainsController.import)

module.exports = router
