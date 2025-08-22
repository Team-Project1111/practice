const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const auth = require('../middleware/auth');

// Get all artists
router.get('/', async (req, res) => {
  try {
    const { artform, state, verified, limit = 20, page = 1 } = req.query;
    
    let query = {};
    
    if (artform) {
      query.artform = artform;
    }
    
    if (state) {
      query.state = state;
    }
    
    if (verified === 'true') {
      query.isVerified = true;
    }
    
    const skip = (page - 1) * limit;
    
    const artists = await Artist.find(query)
      .select('-gallery')
      .limit(parseInt(limit))
      .skip(skip)
      .sort({ rating: -1, createdAt: -1 });
    
    const total = await Artist.countDocuments(query);
    
    res.json({
      artists,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + artists.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get artist by ID
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('followers', 'name profileImage');
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new artist profile
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      artform,
      village,
      state,
      experience,
      bio,
      socialMedia
    } = req.body;
    
    // Check if artist already exists
    const existingArtist = await Artist.findOne({ email });
    if (existingArtist) {
      return res.status(400).json({ message: 'Artist with this email already exists' });
    }
    
    const artist = new Artist({
      name,
      email,
      phone,
      artform,
      village,
      state,
      experience,
      bio,
      socialMedia
    });
    
    await artist.save();
    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update artist profile
router.put('/:id', auth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    // Only allow artist to update their own profile or admin
    if (artist.email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedArtist = await Artist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json(updatedArtist);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add artwork to artist gallery
router.post('/:id/gallery', auth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    if (artist.email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const { title, description, imageUrl, price, isForSale } = req.body;
    
    artist.gallery.push({
      title,
      description,
      imageUrl,
      price,
      isForSale
    });
    
    await artist.save();
    res.json(artist.gallery[artist.gallery.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Follow/Unfollow artist
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    const isFollowing = artist.followers.includes(req.user.id);
    
    if (isFollowing) {
      artist.followers = artist.followers.filter(id => id.toString() !== req.user.id);
    } else {
      artist.followers.push(req.user.id);
    }
    
    await artist.save();
    
    res.json({
      isFollowing: !isFollowing,
      followersCount: artist.followers.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Rate artist
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    // Update rating
    const totalRating = artist.rating * artist.totalRatings + rating;
    artist.totalRatings += 1;
    artist.rating = totalRating / artist.totalRatings;
    
    await artist.save();
    
    res.json({
      rating: artist.rating,
      totalRatings: artist.totalRatings
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search artists
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const artists = await Artist.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { village: { $regex: query, $options: 'i' } },
        { state: { $regex: query, $options: 'i' } },
        { artform: { $regex: query, $options: 'i' } }
      ]
    })
    .select('name artform village state rating profileImage')
    .limit(parseInt(limit))
    .sort({ rating: -1 });
    
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get featured artists
router.get('/featured/list', async (req, res) => {
  try {
    const artists = await Artist.find({ isVerified: true })
      .select('name artform village state rating profileImage bio')
      .sort({ rating: -1, totalRatings: -1 })
      .limit(6);
    
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;