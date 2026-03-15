const Race = require('../models/Race');

// @desc    Get race info
// @route   GET /api/races
// @access  Public
exports.getRaceInfo = async (req, res) => {
  try {
    const race = await Race.findOne().sort({ createdAt: -1 });
    
    if (!race) {
      // Create default race if not exists
      const defaultRace = await Race.create({
        name: 'UWP Fun Run 2024',
        categories: [
          { id: '5k-fun', name: '5K Fun Run', distance: 5, price: 150000, quota: 500 },
          { id: '5k-competitive', name: '5K Competitive', distance: 5, price: 250000, quota: 300 },
          { id: 'family', name: 'Family Run', distance: 3, price: 400000, quota: 100 }
        ]
      });
      return res.json({ success: true, data: defaultRace });
    }
    
    res.json({
      success: true,
      data: race
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update race info (Admin)
// @route   PUT /api/races/:id
// @access  Private/Admin
exports.updateRace = async (req, res) => {
  try {
    const race = await Race.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    
    res.json({
      success: true,
      data: race
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle registration status
// @route   PUT /api/races/:id/toggle-registration
// @access  Private/Admin
exports.toggleRegistration = async (req, res) => {
  try {
    const race = await Race.findById(req.params.id);
    
    if (!race) {
      return res.status(404).json({ message: 'Race not found' });
    }
    
    race.registrationOpen = !race.registrationOpen;
    await race.save();
    
    res.json({
      success: true,
      message: `Registration ${race.registrationOpen ? 'opened' : 'closed'}`,
      data: race
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};