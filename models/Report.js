const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    unique: true,
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportType: {
    type: String,
    enum: ['overflowing_bin', 'pickup_request', 'maintenance_needed', 'illegal_dumping', 'recycling_assistance'],
    required: true
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
    ward: String
  },
  binId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WasteBin'
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'resolved', 'closed'],
    default: 'pending'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: {
    description: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    images: [String]
  },
  estimatedResolutionTime: Date,
  actualResolutionTime: Date,
  citizenFeedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  },
  pointsAwarded: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate unique report ID
reportSchema.pre('save', async function(next) {
  if (!this.reportId) {
    const count = await mongoose.model('Report').countDocuments();
    this.reportId = `RPT-${Date.now()}-${count + 1}`;
  }
  next();
});

// Calculate priority based on report type and location
reportSchema.methods.calculatePriority = function() {
  const priorityMap = {
    'overflowing_bin': 'high',
    'illegal_dumping': 'urgent',
    'maintenance_needed': 'medium',
    'pickup_request': 'medium',
    'recycling_assistance': 'low'
  };
  
  this.priority = priorityMap[this.reportType] || 'medium';
};

module.exports = mongoose.model('Report', reportSchema);