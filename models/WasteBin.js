const mongoose = require('mongoose');

const wasteBinSchema = new mongoose.Schema({
  binId: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      }
    },
    ward: String,
    landmark: String
  },
  binType: {
    type: String,
    enum: ['recyclable', 'biodegradable', 'hazardous', 'general'],
    required: true
  },
  capacity: {
    type: Number,
    required: true,
    default: 100 // in percentage
  },
  currentLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['normal', 'warning', 'critical', 'overflowing', 'maintenance'],
    default: 'normal'
  },
  lastCollected: {
    type: Date,
    default: Date.now
  },
  nextScheduledCollection: Date,
  collectionFrequency: {
    type: String,
    enum: ['daily', 'alternate', 'weekly', 'biweekly'],
    default: 'alternate'
  },
  sensorData: {
    temperature: Number,
    humidity: Number,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  maintenanceHistory: [{
    date: Date,
    type: String,
    description: String,
    technician: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Update status based on current level
wasteBinSchema.methods.updateStatus = function() {
  if (this.currentLevel >= 90) this.status = 'critical';
  else if (this.currentLevel >= 75) this.status = 'warning';
  else this.status = 'normal';
};

// Calculate next collection date
wasteBinSchema.methods.calculateNextCollection = function() {
  const now = new Date();
  const days = {
    'daily': 1,
    'alternate': 2,
    'weekly': 7,
    'biweekly': 14
  };
  
  this.nextScheduledCollection = new Date(now.getTime() + (days[this.collectionFrequency] * 24 * 60 * 60 * 1000));
};

module.exports = mongoose.model('WasteBin', wasteBinSchema);