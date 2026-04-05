const express = require('express');

const validate = require('../../middleware/validate.middleware');
const { loginSchema } = require('../../validations/auth.schemas');
const authController = require('./auth.controller');

const router = express.Router();

router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
