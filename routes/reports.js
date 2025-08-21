const express = require('express');
const Report = require('../models/Report');
const User = require('../models/User');
const WasteBin = require('../models/WasteBin');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Create a new report
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      reportType,
      location,
      binId,
      description,
      images
    } = req.body;

    const report = new Report({
      reportedBy: req.userId,
      reportType,
      location,
      binId,
      description,
      images: images || []
    });

    // Calculate priority
    report.calculatePriority();

    await report.save();

    // Award points to user
    const pointsMap = {
      'overflowing_bin': 50,
      'pickup_request': 30,
      'maintenance_needed': 40,
      'illegal_dumping': 100,
      'recycling_assistance': 20
    };

    const pointsAwarded = pointsMap[reportType] || 30;
    report.pointsAwarded = pointsAwarded;

    // Update user points and stats
    const user = await User.findById(req.userId);
    user.points += pointsAwarded;
    user.recyclingStats.totalReports += 1;
    user.updateLevel();
    await user.save();
    await report.save();

    // Update bin status if binId provided
    if (binId && reportType === 'overflowing_bin') {
      await WasteBin.findByIdAndUpdate(binId, {
        status: 'overflowing',
        currentLevel: 100
      });
    }

    res.status(201).json({
      message: 'Report created successfully',
      report,
      pointsAwarded
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all reports (with filtering)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      status,
      reportType,
      priority,
      ward,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};
    
    // Role-based filtering
    if (req.userRole === 'citizen') {
      filter.reportedBy = req.userId;
    }

    // Apply filters
    if (status) filter.status = status;
    if (reportType) filter.reportType = reportType;
    if (priority) filter.priority = priority;
    if (ward) filter['location.ward'] = ward;

    const reports = await Report.find(filter)
      .populate('reportedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('binId', 'binId location binType')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Report.countDocuments(filter);

    res.json({
      reports,
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

// Get single report
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name email location')
      .populate('assignedTo', 'name email')
      .populate('binId', 'binId location binType status');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user can access this report
    if (req.userRole === 'citizen' && report.reportedBy._id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update report status (admin/collector only)
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (!['admin', 'collector'].includes(req.userRole)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, resolution } = req.body;
    const updateData = { status };

    if (status === 'resolved' && resolution) {
      updateData.resolution = {
        ...resolution,
        resolvedBy: req.userId,
        resolvedAt: new Date()
      };
      updateData.actualResolutionTime = new Date();
    }

    if (status === 'in_progress') {
      updateData.assignedTo = req.userId;
    }

    const report = await Report.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('reportedBy assignedTo binId');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json({ message: 'Report updated successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit citizen feedback
router.post('/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user reported this issue
    if (report.reportedBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'You can only provide feedback on your own reports' });
    }

    // Check if report is resolved
    if (report.status !== 'resolved') {
      return res.status(400).json({ message: 'Can only provide feedback on resolved reports' });
    }

    report.citizenFeedback = {
      rating,
      comment,
      submittedAt: new Date()
    };

    await report.save();

    res.json({ message: 'Feedback submitted successfully', report });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get report statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const stats = await Report.aggregate([
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          averageResolutionTime: {
            $avg: {
              $subtract: ['$actualResolutionTime', '$createdAt']
            }
          }
        }
      }
    ]);

    const reportsByType = await Report.aggregate([
      {
        $group: {
          _id: '$reportType',
          count: { $sum: 1 }
        }
      }
    ]);

    const reportsByPriority = await Report.aggregate([
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        averageResolutionTime: 0
      },
      byType: reportsByType,
      byPriority: reportsByPriority
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;