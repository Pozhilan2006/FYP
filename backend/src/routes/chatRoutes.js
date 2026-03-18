const express = require('express');
const { handleChat } = require('../controllers/intentController');

const router = express.Router();

router.post('/', handleChat);

module.exports = router;
