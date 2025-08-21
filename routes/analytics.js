const express = require('express');
const Report = require('../models/Report');
const WasteBin = require('../models/WasteBin');
const User = require('../models/User');
const { UserReward } = require('../models/Reward');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get dashboard overview
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { timeframe = '30', ward } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let matchFilter = { createdAt: { $gte: startDate } };
    if (ward) matchFilter['location.ward'] = ward;

    // Reports analytics
    const reportStats = await Report.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          pendingReports: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          averageResolutionTime: {
            $avg: {
              $cond: [
                { $ne: ['$actualResolutionTime', null] },
                {
                  $divide: [
                    { $subtract: ['$actualResolutionTime', '$createdAt'] },
                    1000 * 60 * 60 // Convert to hours
                  ]
                },
                null
              ]
            }
          }
        }
      }
    ]);

    // Daily reports trend
    const dailyReports = await Report.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Bin status overview
    const binStats = await WasteBin.aggregate([
      {
        $group: {
          _id: null,
          totalBins: { $sum: 1 },
          criticalBins: {
            $sum: { $cond: [{ $gte: ['$currentLevel', 85] }, 1, 0] }
          },
          overflowingBins: {
            $sum: { $cond: [{ $eq: ['$status', 'overflowing'] }, 1, 0] }
          },
          averageFillLevel: { $avg: '$currentLevel' }
        }
      }
    ]);

    // Ward-wise statistics
    const wardStats = await Report.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$location.ward',
          reportCount: { $sum: 1 },
          resolvedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      { $sort: { reportCount: -1 } },
      { $limit: 10 }
    ]);

    // User engagement
    const userStats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: [{ $gte: ['$recyclingStats.totalReports', 1] }, 1, 0] }
          },
          totalPoints: { $sum: '$points' },
          averagePoints: { $avg: '$points' }
        }
      }
    ]);

    res.json({
      reports: reportStats[0] || {
        totalReports: 0,
        resolvedReports: 0,
        pendingReports: 0,
        averageResolutionTime: 0
      },
      bins: binStats[0] || {
        totalBins: 0,
        criticalBins: 0,
        overflowingBins: 0,
        averageFillLevel: 0
      },
      users: userStats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        totalPoints: 0,
        averagePoints: 0
      },
      trends: {
        dailyReports,
        wardStats
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get waste collection efficiency
router.get('/collection-efficiency', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { timeframe = '30' } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Collection performance by bin type
    const collectionStats = await WasteBin.aggregate([
      {
        $match: {
          lastCollected: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$binType',
          totalBins: { $sum: 1 },
          averageFillLevel: { $avg: '$currentLevel' },
          collectionsCount: {
            $sum: { $cond: [{ $gte: ['$lastCollected', startDate] }, 1, 0] }
          },
          overflowIncidents: {
            $sum: { $cond: [{ $eq: ['$status', 'overflowing'] }, 1, 0] }
          }
        }
      }
    ]);

    // Route optimization data
    const routeData = await WasteBin.aggregate([
      {
        $match: {
          currentLevel: { $gte: 70 },
          isActive: true
        }
      },
      {
        $group: {
          _id: '$location.ward',
          bins: {
            $push: {
              binId: '$binId',
              location: '$location',
              currentLevel: '$currentLevel',
              binType: '$binType',
              priority: {
                $cond: [
                  { $gte: ['$currentLevel', 90] }, 'high',
                  { $cond: [{ $gte: ['$currentLevel', 80] }, 'medium', 'low'] }
                ]
              }
            }
          },
          totalBins: { $sum: 1 },
          averageFillLevel: { $avg: '$currentLevel' }
        }
      },
      { $sort: { averageFillLevel: -1 } }
    ]);

    res.json({
      collectionStats,
      routeOptimization: routeData
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get environmental impact metrics
router.get('/environmental-impact', async (req, res) => {
  try {
    const { timeframe = '30', ward } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let userFilter = {};
    if (ward) userFilter['location.ward'] = ward;

    // Recycling statistics
    const recyclingStats = await User.aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          totalRecyclableItems: { $sum: '$recyclingStats.recyclableItems' },
          totalBiodegradableItems: { $sum: '$recyclingStats.biodegradableItems' },
          totalHazardousItems: { $sum: '$recyclingStats.hazardousItems' },
          totalReports: { $sum: '$recyclingStats.totalReports' },
          participatingUsers: { $sum: 1 }
        }
      }
    ]);

    // Waste reduction estimates (mock calculations)
    const stats = recyclingStats[0] || {
      totalRecyclableItems: 0,
      totalBiodegradableItems: 0,
      totalHazardousItems: 0,
      totalReports: 0,
      participatingUsers: 0
    };

    // Environmental impact calculations (estimated)
    const impactMetrics = {
      co2Saved: Math.round(stats.totalRecyclableItems * 2.5 + stats.totalBiodegradableItems * 1.2), // kg CO2
      waterSaved: Math.round(stats.totalRecyclableItems * 15 + stats.totalBiodegradableItems * 8), // liters
      energySaved: Math.round(stats.totalRecyclableItems * 3.2 + stats.totalBiodegradableItems * 1.8), // kWh
      wasteReduced: Math.round(stats.totalRecyclableItems * 0.8 + stats.totalBiodegradableItems * 0.6 + stats.totalHazardousItems * 0.9), // kg
      treesEquivalent: Math.round((stats.co2Saved || 0) / 22) // trees planted equivalent
    };

    // Ward comparison
    const wardComparison = await User.aggregate([
      {
        $group: {
          _id: '$location.ward',
          totalRecycling: {
            $sum: {
              $add: [
                '$recyclingStats.recyclableItems',
                '$recyclingStats.biodegradableItems',
                '$recyclingStats.hazardousItems'
              ]
            }
          },
          activeUsers: { $sum: 1 },
          averagePoints: { $avg: '$points' }
        }
      },
      { $sort: { totalRecycling: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      recyclingStats: stats,
      environmentalImpact: impactMetrics,
      wardComparison,
      timeframe: `${days} days`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get real-time alerts
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    if (req.userRole === 'citizen') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Critical bin alerts
    const criticalBins = await WasteBin.find({
      $or: [
        { currentLevel: { $gte: 90 } },
        { status: 'overflowing' }
      ],
      isActive: true
    }).select('binId location currentLevel status').limit(10);

    // Pending high priority reports
    const urgentReports = await Report.find({
      status: { $in: ['pending', 'acknowledged'] },
      priority: { $in: ['high', 'urgent'] }
    })
    .populate('reportedBy', 'name')
    .select('reportId reportType location priority createdAt')
    .sort({ createdAt: -1 })
    .limit(10);

    // Overdue collections
    const overdueCollections = await WasteBin.find({
      nextScheduledCollection: { $lt: new Date() },
      status: { $ne: 'maintenance' },
      isActive: true
    }).select('binId location nextScheduledCollection binType').limit(10);

    // System health alerts
    const systemAlerts = [];
    
    // Check for bins without recent sensor updates
    const staleBins = await WasteBin.countDocuments({
      'sensorData.lastUpdated': {
        $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago
      },
      isActive: true
    });

    if (staleBins > 0) {
      systemAlerts.push({
        type: 'sensor_connectivity',
        message: `${staleBins} bins have not reported sensor data in the last 24 hours`,
        severity: 'warning'
      });
    }

    res.json({
      criticalBins,
      urgentReports,
      overdueCollections,
      systemAlerts,
      summary: {
        totalAlerts: criticalBins.length + urgentReports.length + overdueCollections.length + systemAlerts.length,
        critical: criticalBins.length,
        urgent: urgentReports.length,
        overdue: overdueCollections.length,
        system: systemAlerts.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user-specific analytics (for citizens)
router.get('/my-stats', authenticateToken, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query;
    const days = parseInt(timeframe);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // User's reports in timeframe
    const userReports = await Report.find({
      reportedBy: req.userId,
      createdAt: { $gte: startDate }
    });

    // User's rewards in timeframe
    const userRewards = await UserReward.find({
      userId: req.userId,
      redeemedAt: { $gte: startDate }
    }).populate('rewardId', 'title category pointsRequired');

    // User profile
    const user = await User.findById(req.userId).select('-password');

    // Calculate user's impact
    const userImpact = {
      reportsSubmitted: userReports.length,
      pointsEarned: userReports.reduce((sum, report) => sum + (report.pointsAwarded || 0), 0),
      rewardsRedeemed: userRewards.length,
      co2Saved: Math.round(user.recyclingStats.recyclableItems * 2.5 + user.recyclingStats.biodegradableItems * 1.2),
      rank: 0 // Will be calculated
    };

    // Get user's rank
    const higherUsers = await User.countDocuments({
      points: { $gt: user.points },
      isActive: true
    });
    userImpact.rank = higherUsers + 1;

    // Recent activity
    const recentActivity = await Report.find({
      reportedBy: req.userId
    })
    .select('reportType status createdAt pointsAwarded')
    .sort({ createdAt: -1 })
    .limit(5);

    res.json({
      user: {
        name: user.name,
        points: user.points,
        level: user.level,
        recyclingStats: user.recyclingStats
      },
      impact: userImpact,
      recentActivity,
      timeframe: `${days} days`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;