const mongoose = require('mongoose');

const raceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: 'UWP Fun Run 2024'
  },
  year: {
    type: Number,
    required: true,
    default: 2024
  },
  date: {
    type: Date,
    required: true,
    default: new Date('2024-12-15')
  },
  location: {
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  // Early Bird Configuration
  earlyBird: {
    enabled: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: new Date('2024-01-01')
    },
    endDate: {
      type: Date,
      default: new Date('2024-10-31')
    },
    discountPercent: {
      type: Number,
      default: 20
    },
    maxQuota: {
      type: Number,
      default: 200
    },
    currentQuota: {
      type: Number,
      default: 0
    }
  },
  categories: [{
    id: String,
    name: String,
    distance: Number,
    price: Number,
    earlyBirdPrice: Number,
    quota: Number,
    registered: {
      type: Number,
      default: 0
    },
    startTime: String,
    description: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  registrationOpen: {
    type: Boolean,
    default: true
  },
  registrationDeadline: {
    type: Date,
    default: new Date('2024-12-10')
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Method untuk cek apakah early bird masih aktif
raceSchema.methods.isEarlyBirdActive = function() {
  if (!this.earlyBird.enabled) return false;
  if (this.earlyBird.currentQuota >= this.earlyBird.maxQuota) return false;
  
  const now = new Date();
  return now >= this.earlyBird.startDate && now <= this.earlyBird.endDate;
};

// Method untuk dapatkan harga berdasarkan kategori dan waktu
raceSchema.methods.getPrice = function(categoryId) {
  const category = this.categories.find(c => c.id === categoryId);
  if (!category) return 0;
  
  return this.isEarlyBirdActive() ? category.earlyBirdPrice : category.price;
};

// Method untuk cek ketersediaan kategori
raceSchema.methods.isCategoryAvailable = function(categoryId) {
  const category = this.categories.find(c => c.id === categoryId);
  if (!category || !category.isActive) return false;
  return category.registered < category.quota;
};

// Pre-save middleware untuk update timestamp
raceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Race', raceSchema);