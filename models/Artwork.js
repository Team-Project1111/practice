const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: true
  },
  artform: {
    type: String,
    required: true,
    enum: ['Warli', 'Pithora', 'Madhubani', 'Mixed']
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  story: {
    type: String,
    maxlength: 3000
  },
  materials: [{
    type: String,
    trim: true
  }],
  techniques: [{
    type: String,
    trim: true
  }],
  dimensions: {
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches', 'feet'],
      default: 'cm'
    }
  },
  yearCreated: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear()
  },
  images: [{
    url: String,
    caption: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  price: {
    type: Number,
    min: 0
  },
  isForSale: {
    type: Boolean,
    default: false
  },
  isOriginal: {
    type: Boolean,
    default: true
  },
  edition: {
    type: String,
    default: 'Original'
  },
  tags: [{
    type: String,
    trim: true
  }],
  category: {
    type: String,
    enum: ['Traditional', 'Contemporary', 'Fusion', 'Ritual', 'Narrative'],
    default: 'Traditional'
  },
  culturalSignificance: {
    type: String,
    maxlength: 1000
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['Draft', 'Published', 'Sold', 'Archived'],
    default: 'Draft'
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

artworkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for like count
artworkSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
artworkSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

module.exports = mongoose.model('Artwork', artworkSchema);