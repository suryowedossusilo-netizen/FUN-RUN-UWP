const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register,
  getAll,
  getOne,
  search,
  updatePayment,
  updateRacePack,
  delete: deleteParticipant,
  getStats
} = require('../controllers/participantController');
const { auth, adminOnly } = require('../middleware/auth');

// Validation rules
const registerValidation = [
  body('fullName').notEmpty().withMessage('Nama lengkap wajib diisi'),
  body('email').isEmail().withMessage('Email tidak valid'),
  body('phone').notEmpty().withMessage('Nomor telepon wajib diisi'),
  body('category').isIn(['5k-fun', '5k-competitive', 'family']).withMessage('Kategori tidak valid'),
  body('shirtSize').isIn(['XS', 'S', 'M', 'L', 'XL', 'XXL']).withMessage('Ukuran kaos tidak valid')
];

// Public routes
router.post('/', registerValidation, register);
router.get('/search', search);

// Protected routes (Admin only)
router.get('/', auth, adminOnly, getAll);
router.get('/stats', auth, adminOnly, getStats);
router.get('/:id', auth, adminOnly, getOne);
router.put('/:id/payment', auth, adminOnly, updatePayment);
router.put('/:id/racepack', auth, adminOnly, updateRacePack);
router.delete('/:id', auth, adminOnly, deleteParticipant);

module.exports = router;