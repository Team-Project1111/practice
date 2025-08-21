const express = require('express');
const { Reward, UserReward } = require('../models/Reward');
const User = require('../models/User');
const { authenticateToken } = require('./auth');
const router = express.Router();

// Get all available rewards
router.get('/', async (req, res) => {
  try {
    const { category, minPoints, maxPoints } = req.query;
    
    let filter = { 
      isActive: true,
      validUntil: { $gte: new Date() }
    };

    if (category) filter.category = category;
    if (minPoints) filter.pointsRequired = { $gte: parseInt(minPoints) };
    if (maxPoints) filter.pointsRequired = { ...filter.pointsRequired, $lte: parseInt(maxPoints) };

    const rewards = await Reward.find(filter)
      .sort({ pointsRequired: 1 });

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new reward (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const reward = new Reward(req.body);
    await reward.save();

    res.status(201).json({
      message: 'Reward created successfully',
      reward
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Redeem a reward
router.post('/:id/redeem', authenticateToken, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Check if reward is active and valid
    if (!reward.isActive || reward.validUntil < new Date()) {
      return res.status(400).json({ message: 'Reward is not available' });
    }

    // Check redemption limit
    if (reward.maxRedemptions !== -1 && reward.currentRedemptions >= reward.maxRedemptions) {
      return res.status(400).json({ message: 'Reward redemption limit reached' });
    }

    // Check if user has enough points
    const user = await User.findById(req.userId);
    if (user.points < reward.pointsRequired) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        required: reward.pointsRequired,
        current: user.points
      });
    }

    // Check if user already redeemed this reward (for limited rewards)
    const existingRedemption = await UserReward.findOne({
      userId: req.userId,
      rewardId: reward._id,
      status: { $in: ['active', 'used'] }
    });

    if (existingRedemption && reward.category !== 'discount') {
      return res.status(400).json({ message: 'You have already redeemed this reward' });
    }

    // Create user reward
    const userReward = new UserReward({
      userId: req.userId,
      rewardId: reward._id
    });
    await userReward.save();

    // Deduct points from user
    user.points -= reward.pointsRequired;
    await user.save();

    // Update reward redemption count
    reward.currentRedemptions += 1;
    await reward.save();

    res.json({
      message: 'Reward redeemed successfully',
      userReward,
      remainingPoints: user.points
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's redeemed rewards
router.get('/my-rewards', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = { userId: req.userId };
    if (status) filter.status = status;

    const userRewards = await UserReward.find(filter)
      .populate('rewardId')
      .sort({ redeemedAt: -1 });

    res.json(userRewards);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Use a redeemed reward
router.post('/use/:redemptionCode', async (req, res) => {
  try {
    const { usedLocation } = req.body;
    
    const userReward = await UserReward.findOne({
      redemptionCode: req.params.redemptionCode,
      status: 'active'
    }).populate('rewardId userId');

    if (!userReward) {
      return res.status(404).json({ message: 'Invalid or already used redemption code' });
    }

    // Check if reward is still valid
    if (userReward.rewardId.validUntil < new Date()) {
      userReward.status = 'expired';
      await userReward.save();
      return res.status(400).json({ message: 'Reward has expired' });
    }

    // Mark as used
    userReward.status = 'used';
    userReward.usedAt = new Date();
    userReward.usedLocation = usedLocation;
    await userReward.save();

    res.json({
      message: 'Reward used successfully',
      reward: userReward.rewardId,
      user: {
        name: userReward.userId.name,
        email: userReward.userId.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get reward statistics (admin only)
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const stats = await UserReward.aggregate([
      {
        $group: {
          _id: null,
          totalRedemptions: { $sum: 1 },
          activeRewards: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          usedRewards: {
            $sum: { $cond: [{ $eq: ['$status', 'used'] }, 1, 0] }
          },
          expiredRewards: {
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          }
        }
      }
    ]);

    const rewardsByCategory = await Reward.aggregate([
      {
        $lookup: {
          from: 'userrewards',
          localField: '_id',
          foreignField: 'rewardId',
          as: 'redemptions'
        }
      },
      {
        $group: {
          _id: '$category',
          totalRewards: { $sum: 1 },
          totalRedemptions: { $sum: { $size: '$redemptions' } }
        }
      }
    ]);

    const topRewards = await Reward.aggregate([
      {
        $lookup: {
          from: 'userrewards',
          localField: '_id',
          foreignField: 'rewardId',
          as: 'redemptions'
        }
      },
      {
        $project: {
          title: 1,
          category: 1,
          pointsRequired: 1,
          redemptionCount: { $size: '$redemptions' }
        }
      },
      {
        $sort: { redemptionCount: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.json({
      overview: stats[0] || {
        totalRedemptions: 0,
        activeRewards: 0,
        usedRewards: 0,
        expiredRewards: 0
      },
      byCategory: rewardsByCategory,
      topRewards
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10, ward } = req.query;
    
    let matchFilter = { isActive: true };
    if (ward) matchFilter['location.ward'] = ward;

    const leaderboard = await User.aggregate([
      { $match: matchFilter },
      {
        $project: {
          name: 1,
          points: 1,
          level: 1,
          'location.ward': 1,
          'recyclingStats.totalReports': 1,
          'recyclingStats.recyclableItems': 1
        }
      },
      { $sort: { points: -1 } },
      { $limit: parseInt(limit) }
    ]);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;