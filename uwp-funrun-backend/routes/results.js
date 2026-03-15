const express = require('express');
const router = express.Router();
const {
  createResult,
  getResults,
  getResultByBIB,
  bulkUpload,
  exportResults
} = require('../controllers/resultController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', getResults);
router.get('/export', auth, adminOnly, exportResults);
router.get('/:bib', getResultByBIB);
router.post('/', auth, adminOnly, createResult);
router.post('/bulk', auth, adminOnly, bulkUpload);

module.exports = router;