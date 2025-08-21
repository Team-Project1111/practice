const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('./auth');
const User = require('../models/User');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'public/uploads/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'waste-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Waste classification database (mock AI responses)
const wasteClassificationDB = {
  // Recyclable items
  'plastic bottle': { category: 'recyclable', confidence: 0.95, tips: 'Remove cap and rinse before recycling' },
  'aluminum can': { category: 'recyclable', confidence: 0.98, tips: 'Rinse and crush to save space' },
  'glass bottle': { category: 'recyclable', confidence: 0.92, tips: 'Remove labels and rinse thoroughly' },
  'cardboard box': { category: 'recyclable', confidence: 0.89, tips: 'Flatten and remove tape/staples' },
  'newspaper': { category: 'recyclable', confidence: 0.94, tips: 'Keep dry and bundle together' },
  'tin can': { category: 'recyclable', confidence: 0.91, tips: 'Remove labels and rinse clean' },
  'paper': { category: 'recyclable', confidence: 0.88, tips: 'Remove plastic coating if any' },
  'magazine': { category: 'recyclable', confidence: 0.87, tips: 'Remove plastic wrapping first' },

  // Biodegradable items
  'banana peel': { category: 'biodegradable', confidence: 0.96, tips: 'Great for composting, decomposes in 2-10 days' },
  'apple core': { category: 'biodegradable', confidence: 0.94, tips: 'Perfect for home composting' },
  'vegetable scraps': { category: 'biodegradable', confidence: 0.93, tips: 'Excellent for making compost' },
  'coffee grounds': { category: 'biodegradable', confidence: 0.91, tips: 'Great nitrogen source for compost' },
  'eggshells': { category: 'biodegradable', confidence: 0.89, tips: 'Crush before composting, adds calcium' },
  'tea bags': { category: 'biodegradable', confidence: 0.85, tips: 'Remove staples if present' },
  'leaves': { category: 'biodegradable', confidence: 0.97, tips: 'Excellent brown material for compost' },
  'food waste': { category: 'biodegradable', confidence: 0.90, tips: 'Avoid meat and dairy in home compost' },

  // Hazardous items
  'battery': { category: 'hazardous', confidence: 0.97, tips: 'Take to special e-waste collection center' },
  'light bulb': { category: 'hazardous', confidence: 0.89, tips: 'Contains mercury, needs special disposal' },
  'paint can': { category: 'hazardous', confidence: 0.94, tips: 'Take to hazardous waste facility' },
  'chemical bottle': { category: 'hazardous', confidence: 0.96, tips: 'Never mix with regular waste' },
  'electronics': { category: 'hazardous', confidence: 0.92, tips: 'Take to e-waste recycling center' },
  'medicine': { category: 'hazardous', confidence: 0.88, tips: 'Return to pharmacy for safe disposal' },
  'thermometer': { category: 'hazardous', confidence: 0.93, tips: 'Contains mercury, handle with care' },

  // General waste
  'diaper': { category: 'general', confidence: 0.91, tips: 'Cannot be recycled, goes to landfill' },
  'tissue paper': { category: 'general', confidence: 0.87, tips: 'Usually too contaminated to recycle' },
  'styrofoam': { category: 'general', confidence: 0.89, tips: 'Not recyclable in most areas' },
  'chip bag': { category: 'general', confidence: 0.86, tips: 'Mixed materials make recycling difficult' },
  'cigarette butt': { category: 'general', confidence: 0.95, tips: 'Toxic and non-biodegradable' }
};

// Mock AI image analysis function
function analyzeWasteImage(imagePath) {
  // In a real implementation, this would use AI/ML services like:
  // - Google Vision API
  // - AWS Rekognition
  // - Azure Computer Vision
  // - Custom trained model

  // For demo purposes, we'll randomly select from our database
  const items = Object.keys(wasteClassificationDB);
  const randomItem = items[Math.floor(Math.random() * items.length)];
  const result = wasteClassificationDB[randomItem];
  
  return {
    detectedItem: randomItem,
    ...result,
    alternativeSuggestions: getAlternativeSuggestions(result.category)
  };
}

function getAlternativeSuggestions(category) {
  const suggestions = {
    recyclable: [
      'Clean the item thoroughly before recycling',
      'Check local recycling guidelines',
      'Consider upcycling for creative reuse'
    ],
    biodegradable: [
      'Start a home compost bin',
      'Use for garden fertilizer',
      'Check community composting programs'
    ],
    hazardous: [
      'Never put in regular trash',
      'Contact local waste management',
      'Look for manufacturer take-back programs'
    ],
    general: [
      'Try to reduce usage of such items',
      'Look for eco-friendly alternatives',
      'Minimize waste generation'
    ]
  };
  
  return suggestions[category] || [];
}

// AI waste classification endpoint
router.post('/classify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Analyze the image (mock implementation)
    const analysis = analyzeWasteImage(req.file.path);

    // If user is authenticated, update their recycling stats
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await User.findById(decoded.userId);
        if (user) {
          // Update user stats based on classification
          switch (analysis.category) {
            case 'recyclable':
              user.recyclingStats.recyclableItems += 1;
              user.points += 10;
              break;
            case 'biodegradable':
              user.recyclingStats.biodegradableItems += 1;
              user.points += 8;
              break;
            case 'hazardous':
              user.recyclingStats.hazardousItems += 1;
              user.points += 15;
              break;
          }
          user.updateLevel();
          await user.save();
        }
      } catch (authError) {
        // Continue without user updates if authentication fails
        console.log('Auth error in AI classification:', authError.message);
      }
    }

    res.json({
      success: true,
      analysis: {
        detectedItem: analysis.detectedItem,
        category: analysis.category,
        confidence: analysis.confidence,
        tips: analysis.tips,
        suggestions: analysis.alternativeSuggestions
      },
      imageUrl: `/uploads/${req.file.filename}`,
      timestamp: new Date()
    });

  } catch (error) {
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error processing image', error: error.message });
  }
});

// Get waste segregation guidelines
router.get('/guidelines', (req, res) => {
  try {
    const guidelines = {
      recyclable: {
        description: 'Items that can be processed and made into new products',
        examples: [
          'Clean plastic bottles and containers',
          'Aluminum and tin cans',
          'Glass bottles and jars',
          'Paper and cardboard',
          'Clean metal items'
        ],
        tips: [
          'Rinse containers to remove food residue',
          'Remove caps and lids when required',
          'Flatten cardboard to save space',
          'Keep materials dry and clean'
        ],
        color: '#4CAF50'
      },
      biodegradable: {
        description: 'Organic materials that decompose naturally',
        examples: [
          'Fruit and vegetable scraps',
          'Coffee grounds and tea bags',
          'Eggshells and nutshells',
          'Garden waste and leaves',
          'Paper towels (unbleached)'
        ],
        tips: [
          'Start a compost bin at home',
          'Avoid meat and dairy in home compost',
          'Mix green and brown materials',
          'Keep compost moist but not soggy'
        ],
        color: '#8BC34A'
      },
      hazardous: {
        description: 'Materials that can harm health or environment',
        examples: [
          'Batteries and electronics',
          'Paint and chemicals',
          'Light bulbs and thermometers',
          'Medicines and syringes',
          'Motor oil and antifreeze'
        ],
        tips: [
          'Never mix with regular waste',
          'Take to designated collection centers',
          'Keep in original containers',
          'Handle with protective equipment'
        ],
        color: '#F44336'
      },
      general: {
        description: 'Non-recyclable, non-hazardous waste for landfill',
        examples: [
          'Dirty or contaminated items',
          'Mixed material products',
          'Styrofoam and foam packaging',
          'Disposable diapers',
          'Cigarette butts'
        ],
        tips: [
          'Try to minimize this category',
          'Look for reusable alternatives',
          'Consider if item can be cleaned for recycling',
          'Dispose responsibly'
        ],
        color: '#9E9E9E'
      }
    };

    res.json({
      guidelines,
      generalTips: [
        'When in doubt, check with local waste management',
        'Reduce consumption to minimize waste',
        'Reuse items when possible before disposal',
        'Educate others about proper waste segregation'
      ]
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching guidelines', error: error.message });
  }
});

// Get waste item suggestions based on text input
router.get('/suggest/:query', (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const suggestions = [];

    // Search through our classification database
    Object.keys(wasteClassificationDB).forEach(item => {
      if (item.includes(query) || query.includes(item)) {
        suggestions.push({
          item: item,
          category: wasteClassificationDB[item].category,
          confidence: wasteClassificationDB[item].confidence,
          tips: wasteClassificationDB[item].tips
        });
      }
    });

    // If no exact matches, provide category-based suggestions
    if (suggestions.length === 0) {
      const categoryKeywords = {
        recyclable: ['plastic', 'metal', 'glass', 'paper', 'cardboard', 'can', 'bottle'],
        biodegradable: ['food', 'organic', 'fruit', 'vegetable', 'compost', 'garden'],
        hazardous: ['battery', 'chemical', 'paint', 'electronic', 'medicine', 'toxic'],
        general: ['trash', 'garbage', 'waste', 'dirty']
      };

      Object.keys(categoryKeywords).forEach(category => {
        if (categoryKeywords[category].some(keyword => query.includes(keyword))) {
          suggestions.push({
            category: category,
            message: `This appears to be ${category} waste. Please check specific guidelines.`,
            examples: Object.keys(wasteClassificationDB)
              .filter(item => wasteClassificationDB[item].category === category)
              .slice(0, 3)
          });
        }
      });
    }

    res.json({
      query: req.params.query,
      suggestions: suggestions.slice(0, 5), // Limit to top 5 suggestions
      message: suggestions.length === 0 ? 'No specific suggestions found. Please try uploading an image for better classification.' : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error processing suggestion', error: error.message });
  }
});

// Get AI classification statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (req.userRole !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    // Mock statistics for AI usage
    const stats = {
      totalClassifications: 1247,
      accuracyRate: 94.2,
      topCategories: [
        { category: 'recyclable', count: 523, percentage: 41.9 },
        { category: 'biodegradable', count: 398, percentage: 31.9 },
        { category: 'general', count: 201, percentage: 16.1 },
        { category: 'hazardous', count: 125, percentage: 10.0 }
      ],
      dailyUsage: [
        { date: '2024-01-01', classifications: 45 },
        { date: '2024-01-02', classifications: 52 },
        { date: '2024-01-03', classifications: 38 },
        { date: '2024-01-04', classifications: 61 },
        { date: '2024-01-05', classifications: 49 }
      ],
      userEngagement: {
        activeUsers: 342,
        averageClassificationsPerUser: 3.6,
        returnRate: 68.4
      }
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching AI statistics', error: error.message });
  }
});

module.exports = router;