const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['citizen', 'admin', 'collector'],
    default: 'citizen'
  },
  location: {
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    ward: String,
    city: String
  },
  points: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  recyclingStats: {
    totalReports: { type: Number, default: 0 },
    recyclableItems: { type: Number, default: 0 },
    biodegradableItems: { type: Number, default: 0 },
    hazardousItems: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update user level based on points
userSchema.methods.updateLevel = function() {
  if (this.points >= 10000) this.level = 'Platinum';
  else if (this.points >= 5000) this.level = 'Gold';
  else if (this.points >= 2000) this.level = 'Silver';
  else this.level = 'Bronze';
};

module.exports = mongoose.model('User', userSchema);