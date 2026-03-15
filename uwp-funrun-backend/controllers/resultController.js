const Result = require('../models/Result');
const Participant = require('../models/Participant');

// @desc    Input race result
// @route   POST /api/results
// @access  Private/Admin
exports.createResult = async (req, res) => {
  try {
    const { bib, gunTime, status = 'finished', splits = [] } = req.body;
    
    // Find participant
    const participant = await Participant.findOne({ bib });
    if (!participant) {
      return res.status(404).json({ message: 'Peserta dengan BIB tersebut tidak ditemukan' });
    }
    
    // Calculate pace
    const [hours, minutes, seconds] = gunTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + seconds / 60;
    const distance = participant.category === 'family' ? 3 : 5;
    const paceMin = Math.floor(totalMinutes / distance);
    const paceSec = Math.round(((totalMinutes / distance) - paceMin) * 60);
    const pace = `${paceMin}:${String(paceSec).padStart(2, '0')}`;
    
    // Create or update result
    let result = await Result.findOne({ bib });
    
    if (result) {
      // Update existing
      result.gunTime = gunTime;
      result.pace = pace;
      result.status = status;
      result.splits = splits;
      result.verifiedBy = req.user.id;
    } else {
      // Create new
      result = await Result.create({
        participant: participant._id,
        bib,
        category: participant.category,
        gunTime,
        pace,
        status,
        splits,
        verifiedBy: req.user.id
      });
    }
    
    await result.save();
    
    // Update rankings
    await updateRankings(participant.category);
    
    res.status(201).json({
      success: true,
      message: 'Hasil berhasil disimpan',
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all results with rankings
// @route   GET /api/results
// @access  Public
exports.getResults = async (req, res) => {
  try {
    const { category, gender, limit = 100 } = req.query;
    
    let query = { status: 'finished' };
    if (category) query.category = category;
    
    let results = await Result.find(query)
      .populate('participant', 'fullName gender')
      .sort({ gunTime: 1 })
      .limit(parseInt(limit));
    
    // Filter by gender if provided
    if (gender) {
      results = results.filter(r => r.participant?.gender === gender);
    }
    
    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get result by BIB
// @route   GET /api/results/:bib
// @access  Public
exports.getResultByBIB = async (req, res) => {
  try {
    const result = await Result.findOne({ bib: req.params.bib })
      .populate('participant', 'fullName category gender');
    
    if (!result) {
      return res.status(404).json({ message: 'Hasil tidak ditemukan' });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk upload results
// @route   POST /api/results/bulk
// @access  Private/Admin
exports.bulkUpload = async (req, res) => {
  try {
    const { results } = req.body; // Array of results
    
    const created = [];
    const errors = [];
    
    for (const item of results) {
      try {
        const participant = await Participant.findOne({ bib: item.bib });
        if (!participant) {
          errors.push({ bib: item.bib, error: 'Peserta tidak ditemukan' });
          continue;
        }
        
        const result = await Result.create({
          participant: participant._id,
          bib: item.bib,
          category: participant.category,
          gunTime: item.gunTime,
          status: item.status || 'finished',
          verifiedBy: req.user.id
        });
        
        created.push(result);
      } catch (err) {
        errors.push({ bib: item.bib, error: err.message });
      }
    }
    
    // Update all rankings
    const categories = [...new Set(created.map(r => r.category))];
    for (const cat of categories) {
      await updateRankings(cat);
    }
    
    res.json({
      success: true,
      message: `${created.length} hasil berhasil diupload, ${errors.length} gagal`,
      created: created.length,
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export results
// @route   GET /api/results/export
// @access  Private/Admin
exports.exportResults = async (req, res) => {
  try {
    const { category } = req.query;
    
    let query = {};
    if (category) query.category = category;
    
    const results = await Result.find(query)
      .populate('participant', 'fullName email phone gender birthDate')
      .sort({ gunTime: 1 });
    
    // Format for CSV
    const csvData = results.map((r, index) => ({
      rank: index + 1,
      bib: r.bib,
      name: r.participant?.fullName,
      category: r.category,
      gender: r.participant?.gender,
      gunTime: r.gunTime,
      pace: r.pace,
      status: r.status
    }));
    
    res.json({
      success: true,
      data: csvData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to update rankings
async function updateRankings(category) {
  const results = await Result.find({ category, status: 'finished' })
    .sort({ gunTime: 1 });
  
  for (let i = 0; i < results.length; i++) {
    results[i].rank.category = i + 1;
    await results[i].save();
  }
}