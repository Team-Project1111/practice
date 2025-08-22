const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      phone,
      role
    });
    
    await user.save();
    
    // Create JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Create JWT token
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('favorites.artworks')
      .populate('favorites.artists');
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', auth, async (req, res) => {
  try {
    const {
      name,
      phone,
      bio,
      location,
      preferences,
      socialMedia
    } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name,
        phone,
        bio,
        location,
        preferences,
        socialMedia
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Change password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add to favorites
router.post('/favorites/artwork/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const isFavorite = user.favorites.artworks.includes(req.params.id);
    
    if (isFavorite) {
      user.favorites.artworks = user.favorites.artworks.filter(
        id => id.toString() !== req.params.id
      );
    } else {
      user.favorites.artworks.push(req.params.id);
    }
    
    await user.save();
    
    res.json({
      isFavorite: !isFavorite,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add artist to favorites
router.post('/favorites/artist/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const isFavorite = user.favorites.artists.includes(req.params.id);
    
    if (isFavorite) {
      user.favorites.artists = user.favorites.artists.filter(
        id => id.toString() !== req.params.id
      );
    } else {
      user.favorites.artists.push(req.params.id);
    }
    
    await user.save();
    
    res.json({
      isFavorite: !isFavorite,
      message: isFavorite ? 'Removed from favorites' : 'Added to favorites'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create collection
router.post('/collections', auth, async (req, res) => {
  try {
    const { name, description, isPublic = false } = req.body;
    
    const user = await User.findById(req.user.id);
    
    user.collections.push({
      name,
      description,
      isPublic
    });
    
    await user.save();
    
    res.json(user.collections[user.collections.length - 1]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add artwork to collection
router.post('/collections/:collectionId/artwork/:artworkId', auth, async (req, res) => {
  try {
    const { collectionId, artworkId } = req.params;
    
    const user = await User.findById(req.user.id);
    const collection = user.collections.id(collectionId);
    
    if (!collection) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    if (collection.artworks.includes(artworkId)) {
      return res.status(400).json({ message: 'Artwork already in collection' });
    }
    
    collection.artworks.push(artworkId);
    await user.save();
    
    res.json({ message: 'Artwork added to collection' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;