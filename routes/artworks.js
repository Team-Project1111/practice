const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');
const Artist = require('../models/Artist');
const auth = require('../middleware/auth');

// Get all artworks
router.get('/', async (req, res) => {
  try {
    const { 
      artform, 
      category, 
      artist, 
      forSale, 
      limit = 20, 
      page = 1,
      sort = 'createdAt'
    } = req.query;
    
    let query = { status: 'Published' };
    
    if (artform) {
      query.artform = artform;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (artist) {
      query.artist = artist;
    }
    
    if (forSale === 'true') {
      query.isForSale = true;
    }
    
    const skip = (page - 1) * limit;
    
    let sortOption = {};
    if (sort === 'popular') {
      sortOption = { views: -1 };
    } else if (sort === 'likes') {
      sortOption = { 'likes.length': -1 };
    } else if (sort === 'price') {
      sortOption = { price: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }
    
    const artworks = await Artwork.find(query)
      .populate('artist', 'name artform village state profileImage')
      .limit(parseInt(limit))
      .skip(skip)
      .sort(sortOption);
    
    const total = await Artwork.countDocuments(query);
    
    res.json({
      artworks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + artworks.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get artwork by ID
router.get('/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id)
      .populate('artist', 'name artform village state profileImage bio')
      .populate('comments.user', 'name profileImage');
    
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    
    // Increment view count
    artwork.views += 1;
    await artwork.save();
    
    res.json(artwork);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new artwork
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      artform,
      description,
      story,
      materials,
      techniques,
      dimensions,
      yearCreated,
      images,
      price,
      isForSale,
      tags,
      category,
      culturalSignificance
    } = req.body;
    
    // Find artist by user email
    const artist = await Artist.findOne({ email: req.user.email });
    if (!artist) {
      return res.status(400).json({ message: 'Artist profile not found' });
    }
    
    const artwork = new Artwork({
      title,
      artist: artist._id,
      artform,
      description,
      story,
      materials,
      techniques,
      dimensions,
      yearCreated,
      images,
      price,
      isForSale,
      tags,
      category,
      culturalSignificance
    });
    
    await artwork.save();
    
    const populatedArtwork = await Artwork.findById(artwork._id)
      .populate('artist', 'name artform village state profileImage');
    
    res.status(201).json(populatedArtwork);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update artwork
router.put('/:id', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    
    const artist = await Artist.findById(artwork.artist);
    
    // Only allow artist to update their own artwork or admin
    if (artist.email !== req.user.email && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const updatedArtwork = await Artwork.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('artist', 'name artform village state profileImage');
    
    res.json(updatedArtwork);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Like/Unlike artwork
router.post('/:id/like', auth, async (req, res) => {
  try {
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    
    const isLiked = artwork.likes.includes(req.user.id);
    
    if (isLiked) {
      artwork.likes = artwork.likes.filter(id => id.toString() !== req.user.id);
    } else {
      artwork.likes.push(req.user.id);
    }
    
    await artwork.save();
    
    res.json({
      isLiked: !isLiked,
      likeCount: artwork.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to artwork
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ message: 'Comment text is required' });
    }
    
    const artwork = await Artwork.findById(req.params.id);
    
    if (!artwork) {
      return res.status(404).json({ message: 'Artwork not found' });
    }
    
    artwork.comments.push({
      user: req.user.id,
      text: text.trim()
    });
    
    await artwork.save();
    
    const populatedArtwork = await Artwork.findById(req.params.id)
      .populate('comments.user', 'name profileImage');
    
    res.json(populatedArtwork.comments[artwork.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Search artworks
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const { limit = 10 } = req.query;
    
    const artworks = await Artwork.find({
      status: 'Published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
        { artform: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('artist', 'name artform village state')
    .select('title artform images price isForSale')
    .limit(parseInt(limit))
    .sort({ views: -1 });
    
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get featured artworks
router.get('/featured/list', async (req, res) => {
  try {
    const artworks = await Artwork.find({ status: 'Published' })
      .populate('artist', 'name artform village state profileImage')
      .select('title artform images price isForSale views')
      .sort({ views: -1, 'likes.length': -1 })
      .limit(8);
    
    res.json(artworks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get artworks by artform
router.get('/artform/:artform', async (req, res) => {
  try {
    const { artform } = req.params;
    const { limit = 12, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const artworks = await Artwork.find({ 
      artform, 
      status: 'Published' 
    })
    .populate('artist', 'name artform village state profileImage')
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });
    
    const total = await Artwork.countDocuments({ artform, status: 'Published' });
    
    res.json({
      artworks,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + artworks.length < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;