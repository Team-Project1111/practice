const express = require('express');
const router = express.Router();
const Workshop = require('../models/Workshop');
const Artist = require('../models/Artist');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get all workshops
router.get('/', async (req, res) => {
  try {
    const { 
      artform, 
      skillLevel, 
      isOnline, 
      limit = 20, 
      page = 1,
      sort = 'date'
    } = req.query;
    
    let query = { status: 'Published' };
    
    if (artform) {
      query.artform = artform;
    }
    
    if (skillLevel) {
      query.skillLevel = skillLevel;
    }
    
    if (isOnline === 'true') {
      query.isOnline = true;
    } else if (isOnline === 'false') {
      query.isOnline = false;
    }
    
    const skip = (page - 1) * limit;
    
    let sortOption = {};
    if (sort === 'price') {
      sortOption = { price: 1 };
    } else if (sort === 'popular') {
      sortOption = { currentParticipants: -1 };
    } else {
      sortOption = { date: 1 };
    }
    
    const workshops = await Workshop.find(query)
      .populate('artist', 'name artform village state profileImage')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortOption);
    
    const total = await Workshop.countDocuments(query);
    
    res.json({
      workshops,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + workshops.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get workshop by ID
router.get('/:id', async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('artist', 'name artform village state profileImage bio')
      .populate('participants.user', 'name profileImage')
      .populate('reviews.user', 'name profileImage');
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new workshop
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      artform,
      description,
      detailedDescription,
      date,
      duration,
      maxParticipants,
      price,
      location,
      isOnline,
      meetingLink,
      materialsProvided,
      materialsRequired,
      skillLevel,
      images,
      tags
    } = req.body;
    
    // Find artist by user email
    const artist = await Artist.findOne({ email: req.user.email });
    if (!artist) {
      return res.status(400).json({ message: 'Artist profile not found' });
    }
    
    const workshop = new Workshop({
      title,
      artist: artist._id,
      artform,
      description,
      detailedDescription,
      date,
      duration,
      maxParticipants,
      price,
      location,
      isOnline,
      meetingLink,
      materialsProvided,
      materialsRequired,
      skillLevel,
      images,
      tags
    });
    
    await workshop.save();
    
    const populatedWorkshop = await Workshop.findById(workshop._id)
      .populate('artist', 'name artform village state profileImage');
    
    res.status(201).json(populatedWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update workshop
router.put('/:id', auth, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    const artist = await Artist.findById(workshop.artist);
    
    // Only allow artist to update their own workshop or admin
    if (artist.email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedWorkshop = await Workshop.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('artist', 'name artform village state profileImage');
    
    res.json(updatedWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Register for workshop
router.post('/:id/register', auth, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    if (workshop.status !== 'Published') {
      return res.status(400).json({ message: 'Workshop is not available for registration' });
    }
    
    if (workshop.currentParticipants >= workshop.maxParticipants) {
      return res.status(400).json({ message: 'Workshop is full' });
    }
    
    // Check if user is already registered
    const isRegistered = workshop.participants.some(
      participant => participant.user.toString() === req.user.id
    );
    
    if (isRegistered) {
      return res.status(400).json({ message: 'Already registered for this workshop' });
    }
    
    // Add participant
    workshop.participants.push({
      user: req.user.id,
      paymentStatus: 'Pending'
    });
    
    workshop.currentParticipants += 1;
    
    // Update workshop status if full
    if (workshop.currentParticipants >= workshop.maxParticipants) {
      workshop.status = 'Full';
    }
    
    await workshop.save();
    
    // Update user's workshops
    await User.findByIdAndUpdate(req.user.id, {
      $push: {
        workshops: {
          workshop: workshop._id,
          status: 'Registered'
        }
      }
    });
    
    res.json({
      message: 'Successfully registered for workshop',
      currentParticipants: workshop.currentParticipants,
      availableSpots: workshop.maxParticipants - workshop.currentParticipants
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cancel workshop registration
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    // Find and remove participant
    const participantIndex = workshop.participants.findIndex(
      participant => participant.user.toString() === req.user.id
    );
    
    if (participantIndex === -1) {
      return res.status(400).json({ message: 'Not registered for this workshop' });
    }
    
    workshop.participants.splice(participantIndex, 1);
    workshop.currentParticipants -= 1;
    
    // Update workshop status if no longer full
    if (workshop.status === 'Full' && workshop.currentParticipants < workshop.maxParticipants) {
      workshop.status = 'Published';
    }
    
    await workshop.save();
    
    // Update user's workshops
    await User.findByIdAndUpdate(req.user.id, {
      $pull: {
        workshops: { workshop: workshop._id }
      }
    });
    
    res.json({
      message: 'Successfully cancelled workshop registration',
      currentParticipants: workshop.currentParticipants,
      availableSpots: workshop.maxParticipants - workshop.currentParticipants
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add review to workshop
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Valid rating is required' });
    }
    
    const workshop = await Workshop.findById(req.params.id);
    
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    
    // Check if user participated in this workshop
    const participated = workshop.participants.some(
      participant => participant.user.toString() === req.user.id
    );
    
    if (!participated) {
      return res.status(400).json({ message: 'Must participate in workshop to review' });
    }
    
    // Check if user already reviewed
    const existingReview = workshop.reviews.find(
      review => review.user.toString() === req.user.id
    );
    
    if (existingReview) {
      return res.status(400).json({ message: 'Already reviewed this workshop' });
    }
    
    workshop.reviews.push({
      user: req.user.id,
      rating,
      comment
    });
    
    await workshop.save();
    
    const populatedWorkshop = await Workshop.findById(req.params.id)
      .populate('reviews.user', 'name profileImage');
    
    res.json(populatedWorkshop.reviews[workshop.reviews.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search workshops
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const workshops = await Workshop.find({
      status: 'Published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { artform: { $regex: query, $options: 'i' } },
        { location: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('artist', 'name artform village state')
    .select('title artform date duration price location isOnline currentParticipants maxParticipants')
    .limit(parseInt(limit))
    .sort({ date: 1 });
    
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get upcoming workshops
router.get('/upcoming/list', async (req, res) => {
  try {
    const workshops = await Workshop.find({
      status: 'Published',
      date: { $gte: new Date() }
    })
    .populate('artist', 'name artform village state profileImage')
    .select('title artform date duration price location isOnline currentParticipants maxParticipants')
    .sort({ date: 1 })
    .limit(6);
    
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;