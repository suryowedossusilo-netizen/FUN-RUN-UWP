const express = require('express');
const router = express.Router();
const { login, getMe, createAdmin } = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', auth, getMe);
router.post('/create-admin', auth, adminOnly, createAdmin);

module.exports = router;