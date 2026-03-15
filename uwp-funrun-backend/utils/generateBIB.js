const Participant = require('../models/Participant');
const generateBIB = async (category) => {
  try {
    // Get prefix based on category
    const prefixes = {
      '5k-fun': 'F',
      '5k-competitive': 'C',
      'family': 'Y'
    };
    
    const prefix = prefixes[category] || 'X';
    const year = new Date().getFullYear().toString().substr(-2);
    
    // Find last BIB with this prefix
    const lastParticipant = await Participant.findOne({
      bib: new RegExp(`^UWP${year}${prefix}`)
    }).sort({ bib: -1 });
    
    let sequence = 1;
    if (lastParticipant) {
      const lastSequence = parseInt(lastParticipant.bib.slice(-3));
      sequence = lastSequence + 1;
    }
    
    const bibNumber = sequence.toString().padStart(3, '0');
    return `UWP${year}${prefix}${bibNumber}`;
  } catch (error) {
    throw new Error('Error generating BIB: ' + error.message);
  }
};

module.exports = generateBIB;