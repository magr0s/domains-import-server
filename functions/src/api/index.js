const router = require('express').Router()
const apiV1 = require('./v1/routes')

router.use('/v1', apiV1)

module.exports = router
