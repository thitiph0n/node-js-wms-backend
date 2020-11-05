const router = require('express').Router();
const db = require('../helpers/db');

const authorization = require('../middleware/authorization');
const allowAccess = require('../middleware/allowAccess');

const { newUserValidation } = require('../helpers/validation');

router.use(authorization);

router.post('/', async (req, res) => {});

router.get('/', async (req, res) => {});

router.get('/:parcelId', async (req, res) => {});

module.exports = router;
