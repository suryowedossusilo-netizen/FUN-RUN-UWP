const Participant = require('../models/Participant');
const Race = require('../models/Race');
const generateBIB = require('../utils/generateBIB');
const { sendRegistrationConfirmation, sendPaymentConfirmation } = require('../utils/emailService');
const QRCode = require('qrcode');

// @desc    Register new participant
// @route   POST /api/participants
// @access  Public
exports.register = async (req, res) => {
  try {
    const { category, fullName, email, phone, birthDate, gender, identityNumber, shirtSize, emergencyContact, medicalInfo } = req.body;
    
    // Validation
    if (!fullName || !email || !phone || !birthDate || !gender || !category || !shirtSize) {
      return res.status(400).json({ message: 'Semua field wajib diisi' });
    }
    
    // Check if email already registered
    const existingParticipant = await Participant.findOne({ email: email.toLowerCase() });
    if (existingParticipant) {
      return res.status(400).json({ message: 'Email sudah terdaftar' });
    }
    
    // Get active race
    const race = await Race.findOne();
    if (!race) {
      return res.status(400).json({ message: 'Event tidak ditemukan' });
    }
    
    if (!race.registrationOpen) {
      return res.status(400).json({ message: 'Pendaftaran sedang ditutup' });
    }
    
    // Check category
    const catIndex = race.categories.findIndex(c => c.id === category);
    if (catIndex === -1) {
      return res.status(400).json({ message: 'Kategori tidak valid' });
    }
    
    const catData = race.categories[catIndex];
    if (catData.registered >= catData.quota) {
      return res.status(400).json({ message: 'Kuota kategori ini sudah penuh' });
    }
    
    // Check early bird eligibility
    const isEarlyBird = race.isEarlyBirdActive();
    const basePrice = isEarlyBird ? catData.earlyBirdPrice : catData.price;
    const adminFee = 10000;
    const totalPrice = basePrice + adminFee;
    
    // Generate BIB
    const bib = await generateBIB(category, isEarlyBird);
    
    // Generate QR Code
    const qrData = JSON.stringify({ 
      bib, 
      category, 
      isEarlyBird,
      timestamp: new Date().toISOString()
    });
    const qrCode = await QRCode.toDataURL(qrData);
    
    // Create participant
    const participant = await Participant.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      birthDate: new Date(birthDate),
      gender,
      identityNumber: identityNumber || '',
      category,
      shirtSize,
      emergencyContact: emergencyContact || '',
      medicalInfo: medicalInfo || '',
      bib,
      qrCode,
      isEarlyBird,
      originalPrice: catData.price,
      discountApplied: isEarlyBird ? (catData.price - catData.earlyBirdPrice) : 0,
      payment: {
        amount: totalPrice,
        basePrice: basePrice,
        adminFee: adminFee,
        method: null,
        transactionId: null,
        paidAt: null
      },
      status: 'pending',
      registrationDate: new Date(),
      racePack: {
        collected: false,
        collectedAt: null,
        collectedBy: null
      }
    });
    
    // Update race quota
    race.categories[catIndex].registered += 1;
    
    // Update early bird quota if applicable
    if (isEarlyBird) {
      race.earlyBird.currentQuota += 1;
    }
    
    await race.save();
    
    // Send email confirmation (async)
    sendRegistrationConfirmation(participant, isEarlyBird).catch(err => {
      console.error('Email sending failed:', err);
    });
    
    res.status(201).json({
      success: true,
      message: 'Pendaftaran berhasil',
      data: {
        id: participant._id,
        bib: participant.bib,
        fullName: participant.fullName,
        email: participant.email,
        category: participant.category,
        shirtSize: participant.shirtSize,
        isEarlyBird: participant.isEarlyBird,
        pricing: {
          originalPrice: participant.originalPrice,
          discountApplied: participant.discountApplied,
          basePrice: basePrice,
          adminFee: adminFee,
          totalPrice: totalPrice
        },
        status: participant.status,
        registrationDate: participant.registrationDate,
        qrCode: participant.qrCode,
        earlyBirdMessage: isEarlyBird ? 'Selamat! Anda mendapat harga Early Bird!' : null,
        paymentInstructions: {
          bank: 'BCA',
          accountNumber: '123-456-7890',
          accountName: 'UWP Fun Run',
          transferCode: `UWP-${participant.bib}`
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message || 'Terjadi kesalahan saat pendaftaran' });
  }
};

// @desc    Get early bird status
// @route   GET /api/participants/earlybird-status
// @access  Public
exports.getEarlyBirdStatus = async (req, res) => {
  try {
    const race = await Race.findOne();
    if (!race) {
      return res.status(404).json({ message: 'Event tidak ditemukan' });
    }
    
    const now = new Date();
    const isActive = race.isEarlyBirdActive();
    const remainingQuota = race.earlyBird.maxQuota - race.earlyBird.currentQuota;
    const remainingTime = race.earlyBird.endDate - now;
    const remainingDays = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
    const remainingHours = Math.ceil(remainingTime / (1000 * 60 * 60));
    
    // Get categories with early bird pricing
    const categoriesWithPricing = race.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      regularPrice: cat.price,
      earlyBirdPrice: cat.earlyBirdPrice,
      savings: cat.price - cat.earlyBirdPrice
    }));
    
    res.json({
      success: true,
      data: {
        isActive,
        discountPercent: race.earlyBird.discountPercent,
        remainingQuota: Math.max(0, remainingQuota),
        remainingDays: Math.max(0, remainingDays),
        remainingHours: Math.max(0, remainingHours),
        endDate: race.earlyBird.endDate,
        startDate: race.earlyBird.startDate,
        currentQuota: race.earlyBird.currentQuota,
        maxQuota: race.earlyBird.maxQuota,
        progressPercent: Math.round((race.earlyBird.currentQuota / race.earlyBird.maxQuota) * 100),
        categories: categoriesWithPricing,
        urgency: remainingQuota < 10 ? 'high' : remainingQuota < 50 ? 'medium' : 'low'
      }
    });
  } catch (error) {
    console.error('Early bird status error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all participants (Admin only)
// @route   GET /api/participants
// @access  Private/Admin
exports.getAll = async (req, res) => {
  try {
    const { status, category, search, isEarlyBird, page = 1, limit = 50, sortBy = 'registrationDate', order = 'desc' } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (isEarlyBird !== undefined) query.isEarlyBird = isEarlyBird === 'true';
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bib: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = order === 'asc' ? 1 : -1;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [participants, total] = await Promise.all([
      Participant.find(query)
        .select('-qrCode')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Participant.countDocuments(query)
    ]);
    
    // Get summary stats
    const summary = await Participant.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$payment.amount', 0] } },
          totalDiscount: { $sum: '$discountApplied' },
          earlyBirdCount: { $sum: { $cond: ['$isEarlyBird', 1, 0] } }
        }
      }
    ]);
    
    res.json({
      success: true,
      count: participants.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      summary: summary[0] || { totalRevenue: 0, totalDiscount: 0, earlyBirdCount: 0 },
      data: participants
    });
  } catch (error) {
    console.error('Get all participants error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single participant by ID
// @route   GET /api/participants/:id
// @access  Private/Admin
exports.getOne = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Get one participant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get participant by BIB (Public)
// @route   GET /api/participants/bib/:bib
// @access  Public
exports.getByBib = async (req, res) => {
  try {
    const participant = await Participant.findOne({ 
      bib: req.params.bib.toUpperCase() 
    }).select('-qrCode -identityNumber');
    
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Get by BIB error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search participant by BIB or Email
// @route   GET /api/participants/search
// @access  Public
exports.search = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 3) {
      return res.status(400).json({ message: 'Query pencarian minimal 3 karakter' });
    }
    
    const searchQuery = q.trim();
    
    const participant = await Participant.findOne({
      $or: [
        { bib: searchQuery.toUpperCase() },
        { email: searchQuery.toLowerCase() }
      ]
    }).select('-qrCode -identityNumber -medicalInfo');
    
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    res.json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Search participant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update payment status
// @route   PUT /api/participants/:id/payment
// @access  Private/Admin
exports.updatePayment = async (req, res) => {
  try {
    const { status, method, transactionId, notes } = req.body;
    
    if (!['pending', 'paid', 'cancelled', 'refunded'].includes(status)) {
      return res.status(400).json({ message: 'Status pembayaran tidak valid' });
    }
    
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    const previousStatus = participant.status;
    
    // Update payment info
    participant.status = status;
    if (method) participant.payment.method = method;
    if (transactionId) participant.payment.transactionId = transactionId;
    if (notes) participant.payment.notes = notes;
    
    if (status === 'paid' && previousStatus !== 'paid') {
      participant.payment.paidAt = new Date();
      
      // Send payment confirmation email
      sendPaymentConfirmation(participant).catch(err => {
        console.error('Payment confirmation email failed:', err);
      });
    }
    
    await participant.save();
    
    res.json({
      success: true,
      message: 'Status pembayaran diperbarui',
      data: {
        id: participant._id,
        bib: participant.bib,
        status: participant.status,
        payment: participant.payment,
        paidAt: participant.payment.paidAt
      }
    });
  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update race pack collection status
// @route   PUT /api/participants/:id/racepack
// @access  Private/Admin
exports.updateRacePack = async (req, res) => {
  try {
    const { collected } = req.body;
    
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    if (collected && participant.status !== 'paid') {
      return res.status(400).json({ message: 'Peserta belum melakukan pembayaran' });
    }
    
    participant.racePack.collected = collected;
    participant.racePack.collectedAt = collected ? new Date() : null;
    participant.racePack.collectedBy = collected ? (req.user?.username || 'admin') : null;
    
    await participant.save();
    
    res.json({
      success: true,
      message: `Race pack ${collected ? 'sudah diambil' : 'batal diambil'}`,
      data: {
        bib: participant.bib,
        racePack: participant.racePack
      }
    });
  } catch (error) {
    console.error('Update racepack error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update participant data
// @route   PUT /api/participants/:id
// @access  Private/Admin
exports.update = async (req, res) => {
  try {
    const allowedUpdates = ['fullName', 'phone', 'shirtSize', 'emergencyContact', 'medicalInfo'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    res.json({
      success: true,
      message: 'Data peserta diperbarui',
      data: participant
    });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete participant
// @route   DELETE /api/participants/:id
// @access  Private/Admin
exports.delete = async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({ message: 'Peserta tidak ditemukan' });
    }
    
    // Update race quota if participant was paid
    if (participant.status === 'paid') {
      const race = await Race.findOne();
      if (race) {
        const catIndex = race.categories.findIndex(c => c.id === participant.category);
        if (catIndex !== -1) {
          race.categories[catIndex].registered = Math.max(0, race.categories[catIndex].registered - 1);
          
          // Restore early bird quota if applicable
          if (participant.isEarlyBird) {
            race.earlyBird.currentQuota = Math.max(0, race.earlyBird.currentQuota - 1);
          }
          
          await race.save();
        }
      }
    }
    
    await participant.deleteOne();
    
    res.json({
      success: true,
      message: 'Peserta berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get statistics
// @route   GET /api/participants/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const [
      total,
      paid,
      pending,
      cancelled,
      todayRegistrations,
      revenue,
      byCategory,
      byShirtSize,
      byGender,
      earlyBirdStats
    ] = await Promise.all([
      Participant.countDocuments(),
      Participant.countDocuments({ status: 'paid' }),
      Participant.countDocuments({ status: 'pending' }),
      Participant.countDocuments({ status: 'cancelled' }),
      Participant.countDocuments({ registrationDate: { $gte: startOfDay } }),
      Participant.aggregate([
        { $match: { status: 'paid' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]),
      Participant.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 }, paid: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } } } }
      ]),
      Participant.aggregate([
        { $group: { _id: '$shirtSize', count: { $sum: 1 } } }
      ]),
      Participant.aggregate([
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]),
      Participant.aggregate([
        { $match: { isEarlyBird: true } },
        { $group: { 
          _id: null, 
          count: { $sum: 1 },
          totalDiscount: { $sum: '$discountApplied' }
        }}
      ])
    ]);
    
    // Calculate conversion rate
    const conversionRate = total > 0 ? ((paid / total) * 100).toFixed(2) : 0;
    
    res.json({
      success: true,
      data: {
        overview: {
          total,
          paid,
          pending,
          cancelled,
          todayRegistrations,
          conversionRate: parseFloat(conversionRate)
        },
        revenue: {
          total: revenue[0]?.total || 0,
          currency: 'IDR'
        },
        earlyBird: {
          participants: earlyBirdStats[0]?.count || 0,
          totalDiscount: earlyBirdStats[0]?.totalDiscount || 0
        },
        demographics: {
          byCategory,
          byShirtSize,
          byGender
        }
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk update payment status (for admin)
// @route   PUT /api/participants/bulk/payment
// @access  Private/Admin
exports.bulkUpdatePayment = async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'ID peserta diperlukan' });
    }
    
    const result = await Participant.updateMany(
      { _id: { $in: ids } },
      { 
        $set: { 
          status,
          'payment.paidAt': status === 'paid' ? new Date() : null
        } 
      }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} peserta diperbarui`,
      data: result
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export participants to CSV
// @route   GET /api/participants/export
// @access  Private/Admin
exports.exportParticipants = async (req, res) => {
  try {
    const { status, category } = req.query;
    let query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    
    const participants = await Participant.find(query)
      .select('-qrCode')
      .sort({ registrationDate: -1 })
      .lean();
    
    // Format data for CSV
    const csvData = participants.map(p => ({
      BIB: p.bib,
      Nama: p.fullName,
      Email: p.email,
      Telepon: p.phone,
      Kategori: p.category,
      UkuranKaos: p.shirtSize,
      Status: p.status,
      TotalBayar: p.payment.amount,
      TanggalDaftar: p.registrationDate,
      EarlyBird: p.isEarlyBird ? 'Ya' : 'Tidak',
      Diskon: p.discountApplied
    }));
    
    res.json({
      success: true,
      count: csvData.length,
      data: csvData
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: error.message });
  }
};