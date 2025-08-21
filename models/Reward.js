const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['discount', 'coupon', 'badge', 'certificate', 'gift'],
    required: true
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0
  },
  value: {
    type: String, // e.g., "20% off", "Free coffee", etc.
    required: true
  },
  validUntil: {
    type: Date,
    required: true
  },
  maxRedemptions: {
    type: Number,
    default: -1 // -1 means unlimited
  },
  currentRedemptions: {
    type: Number,
    default: 0
  },
  partnerCompany: {
    name: String,
    logo: String,
    contact: String
  },
  terms: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: String
}, {
  timestamps: true
});

const userRewardSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reward',
    required: true
  },
  redeemedAt: {
    type: Date,
    default: Date.now
  },
  redemptionCode: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'used', 'expired'],
    default: 'active'
  },
  usedAt: Date,
  usedLocation: String
}, {
  timestamps: true
});

// Generate unique redemption code
userRewardSchema.pre('save', function(next) {
  if (!this.redemptionCode) {
    this.redemptionCode = `RWD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

const Reward = mongoose.model('Reward', rewardSchema);
const UserReward = mongoose.model('UserReward', userRewardSchema);

module.exports = { Reward, UserReward };