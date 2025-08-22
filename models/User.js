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
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'artist', 'admin', 'curator'],
    default: 'user'
  },
  profileImage: {
    type: String
  },
  bio: {
    type: String,
    maxlength: 500
  },
  location: {
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  preferences: {
    favoriteArtforms: [{
      type: String,
      enum: ['Warli', 'Pithora', 'Madhubani', 'Mixed']
    }],
    interests: [{
      type: String,
      trim: true
    }],
    newsletter: {
      type: Boolean,
      default: true
    }
  },
  favorites: {
    artworks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    }],
    artists: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artist'
    }]
  },
  collections: [{
    name: String,
    description: String,
    artworks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    }],
    isPublic: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  workshops: [{
    workshop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop'
    },
    status: {
      type: String,
      enum: ['Registered', 'Completed', 'Cancelled'],
      default: 'Registered'
    },
    registrationDate: {
      type: Date,
      default: Date.now
    }
  }],
  reviews: [{
    artwork: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Artwork'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
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

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.email;
  delete userObject.phone;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);