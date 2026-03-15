const express = require('express');
const router = express.Router();
const {
  getRaceInfo,
  updateRace,
  toggleRegistration
} = require('../controllers/raceController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', getRaceInfo);
router.put('/:id', auth, adminOnly, updateRace);
router.put('/:id/toggle-registration', auth, adminOnly, toggleRegistration);

module.exports = router;