const express = require('express');
const WasteBin = require('../models/WasteBin');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all bins (with filtering)
router.get('/', async (req, res) => {
  try {
    const {
      binType,
      status,
      ward,
      lat,
      lng,
      radius = 5, // km
      page = 1,
      limit = 50
    } = req.query;

    let filter = { isActive: true };

    // Apply filters
    if (binType) filter.binType = binType;
    if (status) filter.status = status;
    if (ward) filter['location.ward'] = ward;

    let bins;
    
    // Location-based search
    if (lat && lng) {
      const earthRadius = 6371; // km
      const radiusInRadians = radius / earthRadius;
      
      bins = await WasteBin.find({
        ...filter,
        'location.coordinates': {
          $geoWithin: {
            $centerSphere: [[parseFloat(lng), parseFloat(lat)], radiusInRadians]
          }
        }
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ currentLevel: -1 });
    } else {
      bins = await WasteBin.find(filter)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ currentLevel: -1 });
    }

    const total = await WasteBin.countDocuments(filter);

    res.json({
      bins,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new bin (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bin = new WasteBin(req.body);
    bin.calculateNextCollection();
    await bin.save();

    res.status(201).json({
      message: 'Waste bin created successfully',
      bin
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get single bin
router.get('/:id', async (req, res) => {
  try {
    const bin = await WasteBin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }
    res.json(bin);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update bin status/level (admin/collector only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'collector'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bin = await WasteBin.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    // Update status based on current level
    bin.updateStatus();
    await bin.save();

    res.json({ message: 'Bin updated successfully', bin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Mark bin as collected
router.post('/:id/collect', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'collector'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const bin = await WasteBin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    // Update bin after collection
    bin.currentLevel = 0;
    bin.lastCollected = new Date();
    bin.status = 'normal';
    bin.calculateNextCollection();

    await bin.save();

    res.json({ message: 'Bin marked as collected', bin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bins requiring attention
router.get('/alerts/critical', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const criticalBins = await WasteBin.find({
      $or: [
        { status: 'critical' },
        { status: 'overflowing' },
        { currentLevel: { $gte: 85 } }
      ],
      isActive: true
    }).sort({ currentLevel: -1 });

    const maintenanceBins = await WasteBin.find({
      status: 'maintenance',
      isActive: true
    });

    const overdueBins = await WasteBin.find({
      nextScheduledCollection: { $lt: new Date() },
      status: { $ne: 'maintenance' },
      isActive: true
    });

    res.json({
      critical: criticalBins,
      maintenance: maintenanceBins,
      overdue: overdueBins,
      totalAlerts: criticalBins.length + maintenanceBins.length + overdueBins.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get bin statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await WasteBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          activeBins: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          criticalBins: {
            $sum: { $cond: [{ $gte: ['$currentLevel', 85] }, 1, 0] }
          },
          averageFillLevel: { $avg: '$currentLevel' }
        }
      }
    ]);

    const binsByType = await WasteBin.aggregate([
      {
        $group: {
          _id: '$binType',
          count: { $sum: 1 },
          averageFillLevel: { $avg: '$currentLevel' }
        }
      }
    ]);

    const binsByStatus = await WasteBin.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalBins: 0,
        activeBins: 0,
        criticalBins: 0,
        averageFillLevel: 0
      },
      byType: binsByType,
      byStatus: binsByStatus
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Simulate sensor data update (for demo purposes)
router.post('/:id/sensor-update', async (req, res) => {
  try {
    const { currentLevel, temperature, humidity } = req.body;
    
    const bin = await WasteBin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: 'Bin not found' });
    }

    // Update sensor data
    if (currentLevel !== undefined) bin.currentLevel = currentLevel;
    if (temperature !== undefined) bin.sensorData.temperature = temperature;
    if (humidity !== undefined) bin.sensorData.humidity = humidity;
    bin.sensorData.lastUpdated = new Date();

    // Update status based on fill level
    bin.updateStatus();
    
    await bin.save();

    res.json({ message: 'Sensor data updated', bin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;