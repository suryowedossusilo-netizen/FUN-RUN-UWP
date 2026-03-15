const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Race = require('../models/Race');
require('dotenv').config();

const connectDB = require('../config/database');
connectDB();

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Race.deleteMany();
    
    console.log('Data cleared...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      username: 'admin',
      password: adminPassword,
      role: 'superadmin'
    });
    
    console.log('Admin user created (username: admin, password: admin123)');
    
    // Create default race dengan early bird
    await Race.create({
      name: 'UWP Fun Run 2024',
      year: 2024,
      date: new Date('2024-12-15'),
      location: {
        name: 'GBK Senayan',
        address: 'Jl. Pintu Satu Senayan, Jakarta Pusat',
        coordinates: {
          lat: -6.2183,
          lng: 106.8028
        }
      },
      
      // ✅ TAMBAHKAN INI: Early Bird Configuration
      earlyBird: {
        enabled: true,
        startDate: new Date('2024-03-01'),    // Mulai 1 Maret 2024
        endDate: new Date('2024-10-31'),      // Berakhir 31 Oktober 2024
        discountPercent: 20,                   // Diskon 20%
        maxQuota: 200,                         // Maksimal 200 pendaftar
        currentQuota: 0                        // Mulai dari 0
      },
      
      categories: [
        {
          id: '5k-fun',
          name: '5K Fun Run',
          distance: 5,
          price: 150000,           // Harga normal
          earlyBirdPrice: 120000,  // ✅ Harga early bird (hemat 30k)
          quota: 500,
          registered: 0,           // ✅ Tambahkan counter
          startTime: '06:15',
          description: 'Lari santai 5K untuk semua kalangan',
          isActive: true
        },
        {
          id: '5k-competitive',
          name: '5K Competitive',
          distance: 5,
          price: 250000,           // Harga normal
          earlyBirdPrice: 200000,  // ✅ Harga early bird (hemat 50k)
          quota: 300,
          registered: 0,           // ✅ Tambahkan counter
          startTime: '06:00',
          description: 'Lari kompetitif dengan timing chip',
          isActive: true
        },
        {
          id: 'family',
          name: 'Family Run',
          distance: 3,
          price: 400000,           // Harga normal
          earlyBirdPrice: 350000,  // ✅ Harga early bird (hemat 50k)
          quota: 100,
          registered: 0,           // ✅ Tambahkan counter
          startTime: '06:30',
          description: 'Lari keluarga (2 dewasa + 2 anak)',
          isActive: true
        }
      ],
      
      status: 'upcoming',
      registrationOpen: true,
      registrationDeadline: new Date('2024-12-10')
    });
    
    console.log('✅ Default race created with Early Bird support!');
    console.log('Early Bird: 20% OFF sampai 31 Oktober 2024 atau 200 pendaftar');
    console.log('Seeding completed!');
    
    process.exit();
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();