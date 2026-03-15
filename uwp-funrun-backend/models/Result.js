const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant',
    required: true
  },
  bib: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  startTime: {
    type: Date
  },
  finishTime: {
    type: Date
  },
  gunTime: {
    type: String
  },
  chipTime: {
    type: String
  },
  pace: {
    type: String
  },
  status: {
    type: String,
    enum: ['finished', 'dnf', 'dq', 'dns'],
    default: 'finished'
  },
  splits: [{
    km: Number,
    time: String,
    pace: String
  }],
  rank: {
    overall: Number,
    gender: Number,
    category: Number
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for ranking queries
resultSchema.index({ category: 1, gunTime: 1 });
resultSchema.index({ bib: 1 });

module.exports = mongoose.model('Result', resultSchema);