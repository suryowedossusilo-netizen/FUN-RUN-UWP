const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate
    if (!username || !password) {
      return res.status(400).json({ message: 'Username dan password wajib diisi' });
    }
    
    // Check for user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    // Only superadmin can create new admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Hanya superadmin yang dapat membuat admin baru' });
    }
    
    const { username, password, role = 'admin' } = req.body;
    
    const user = await User.create({
      username,
      password,
      role
    });
    
    res.status(201).json({
      success: true,
      message: 'Admin berhasil dibuat',
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};