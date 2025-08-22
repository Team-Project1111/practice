const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  artform: {
    type: String,
    required: true,
    enum: ['Warli', 'Pithora', 'Madhubani', 'Mixed']
  },
  village: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  profileImage: {
    type: String
  },
  gallery: [{
    title: String,
    description: String,
    imageUrl: String,
    price: Number,
    isForSale: {
      type: Boolean,
      default: false
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  awards: [{
    title: String,
    year: Number,
    description: String
  }],
  workshops: [{
    title: String,
    description: String,
    date: Date,
    duration: String,
    price: Number,
    maxParticipants: Number,
    currentParticipants: {
      type: Number,
      default: 0
    }
  }],
  socialMedia: {
    instagram: String,
    facebook: String,
    youtube: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

artistSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Artist', artistSchema);