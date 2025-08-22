const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Artist = require('./models/Artist');
const Artwork = require('./models/Artwork');
const Workshop = require('./models/Workshop');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/folk_art_heritage', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected for data initialization'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@folkart.com',
    password: 'admin123',
    role: 'admin',
    phone: '+91-9876543210',
    location: {
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India'
    },
    preferences: {
      favoriteArtforms: ['Warli', 'Madhubani'],
      interests: ['Traditional Art', 'Cultural Heritage'],
      newsletter: true
    }
  },
  {
    name: 'Art Enthusiast',
    email: 'user@folkart.com',
    password: 'user123',
    role: 'user',
    phone: '+91-9876543211',
    location: {
      city: 'Delhi',
      state: 'Delhi',
      country: 'India'
    },
    preferences: {
      favoriteArtforms: ['Pithora', 'Warli'],
      interests: ['Art Collection', 'Workshops'],
      newsletter: true
    }
  }
];

const sampleArtists = [
  {
    name: 'Rajesh Warli',
    email: 'rajesh.warli@folkart.com',
    phone: '+91-9876543212',
    artform: 'Warli',
    village: 'Dahanu',
    state: 'Maharashtra',
    experience: 25,
    bio: 'Master Warli artist with over 25 years of experience. Specializes in traditional tribal motifs and contemporary interpretations.',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    awards: [
      {
        title: 'National Award for Folk Art',
        year: 2020,
        description: 'Recognized for outstanding contribution to Warli art preservation'
      }
    ],
    socialMedia: {
      instagram: '@rajeshwarli',
      facebook: 'rajesh.warli.artist',
      youtube: 'RajeshWarliArt'
    },
    isVerified: true,
    rating: 4.8,
    totalRatings: 45
  },
  {
    name: 'Lakshmi Devi',
    email: 'lakshmi.madhubani@folkart.com',
    phone: '+91-9876543213',
    artform: 'Madhubani',
    village: 'Madhubani',
    state: 'Bihar',
    experience: 30,
    bio: 'Renowned Madhubani artist preserving the ancient art form for three decades. Expert in mythological themes and nature motifs.',
    profileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400',
    awards: [
      {
        title: 'Padma Shri Nominee',
        year: 2021,
        description: 'Nominated for Padma Shri for contribution to Madhubani art'
      },
      {
        title: 'State Cultural Award',
        year: 2019,
        description: 'Bihar State Award for Cultural Excellence'
      }
    ],
    socialMedia: {
      instagram: '@lakshmimadhubani',
      facebook: 'lakshmi.madhubani.art',
      youtube: 'LakshmiMadhubani'
    },
    isVerified: true,
    rating: 4.9,
    totalRatings: 67
  },
  {
    name: 'Bhagwan Pithora',
    email: 'bhagwan.pithora@folkart.com',
    phone: '+91-9876543214',
    artform: 'Pithora',
    village: 'Chhota Udaipur',
    state: 'Gujarat',
    experience: 20,
    bio: 'Traditional Pithora artist from Gujarat, specializing in ritual art and tribal deity paintings.',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    awards: [
      {
        title: 'Gujarat Folk Art Award',
        year: 2022,
        description: 'Awarded for excellence in Pithora art preservation'
      }
    ],
    socialMedia: {
      instagram: '@bhagwanpithora',
      facebook: 'bhagwan.pithora.art',
      youtube: 'BhagwanPithora'
    },
    isVerified: true,
    rating: 4.7,
    totalRatings: 34
  },
  {
    name: 'Sunita Warli',
    email: 'sunita.warli@folkart.com',
    phone: '+91-9876543215',
    artform: 'Warli',
    village: 'Palghar',
    state: 'Maharashtra',
    experience: 15,
    bio: 'Young Warli artist bringing contemporary themes to traditional art form. Known for innovative compositions.',
    profileImage: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    awards: [
      {
        title: 'Young Artist Award',
        year: 2023,
        description: 'Recognized as emerging talent in Warli art'
      }
    ],
    socialMedia: {
      instagram: '@sunita.warli',
      facebook: 'sunita.warli.artist',
      youtube: 'SunitaWarli'
    },
    isVerified: true,
    rating: 4.6,
    totalRatings: 28
  },
  {
    name: 'Rekha Madhubani',
    email: 'rekha.madhubani@folkart.com',
    phone: '+91-9876543216',
    artform: 'Madhubani',
    village: 'Jitwarpur',
    state: 'Bihar',
    experience: 18,
    bio: 'Contemporary Madhubani artist blending traditional techniques with modern themes.',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    socialMedia: {
      instagram: '@rekhamadhubani',
      facebook: 'rekha.madhubani.art',
      youtube: 'RekhaMadhubani'
    },
    isVerified: true,
    rating: 4.5,
    totalRatings: 22
  },
  {
    name: 'Devraj Pithora',
    email: 'devraj.pithora@folkart.com',
    phone: '+91-9876543217',
    artform: 'Pithora',
    village: 'Vadodara',
    state: 'Gujarat',
    experience: 12,
    bio: 'Young Pithora artist specializing in contemporary interpretations of tribal art.',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
    socialMedia: {
      instagram: '@devrajpithora',
      facebook: 'devraj.pithora.art',
      youtube: 'DevrajPithora'
    },
    isVerified: true,
    rating: 4.4,
    totalRatings: 19
  }
];

const sampleArtworks = [
  {
    title: 'Warli Village Life',
    artform: 'Warli',
    description: 'Traditional Warli painting depicting daily village activities including farming, fishing, and community gatherings.',
    story: 'This artwork captures the essence of tribal life in Maharashtra, showing the harmony between humans and nature.',
    materials: ['Rice paste', 'Cow dung', 'Natural pigments'],
    techniques: ['Brush painting', 'Geometric patterns'],
    dimensions: { width: 60, height: 40, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
        caption: 'Warli Village Life - Main View',
        isPrimary: true
      }
    ],
    price: 15000,
    isForSale: true,
    isOriginal: true,
    tags: ['village life', 'tribal art', 'daily activities'],
    category: 'Traditional',
    culturalSignificance: 'Represents the traditional lifestyle of Warli tribes and their connection with nature.'
  },
  {
    title: 'Madhubani Wedding Ceremony',
    artform: 'Madhubani',
    description: 'Vibrant Madhubani painting showing traditional wedding rituals and celebrations.',
    story: 'This piece celebrates the rich cultural heritage of Bihar through wedding ceremonies and rituals.',
    materials: ['Natural dyes', 'Bamboo pen', 'Handmade paper'],
    techniques: ['Fine line work', 'Double line borders'],
    dimensions: { width: 80, height: 60, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
        caption: 'Madhubani Wedding Ceremony - Main View',
        isPrimary: true
      }
    ],
    price: 25000,
    isForSale: true,
    isOriginal: true,
    tags: ['wedding', 'ceremony', 'rituals'],
    category: 'Traditional',
    culturalSignificance: 'Depicts traditional wedding customs and the importance of marriage in Indian culture.'
  },
  {
    title: 'Pithora Ritual Dance',
    artform: 'Pithora',
    description: 'Sacred Pithora painting showing tribal dance rituals and deity worship.',
    story: 'This artwork represents the spiritual connection between tribal communities and their deities.',
    materials: ['Natural pigments', 'Cow dung', 'Clay'],
    techniques: ['Ritual painting', 'Sacred motifs'],
    dimensions: { width: 70, height: 50, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
        caption: 'Pithora Ritual Dance - Main View',
        isPrimary: true
      }
    ],
    price: 18000,
    isForSale: true,
    isOriginal: true,
    tags: ['ritual', 'dance', 'deity worship'],
    category: 'Ritual',
    culturalSignificance: 'Represents the sacred rituals and spiritual beliefs of tribal communities in Gujarat.'
  },
  {
    title: 'Warli Tree of Life',
    artform: 'Warli',
    description: 'Contemporary interpretation of the Tree of Life motif in Warli style.',
    story: 'A modern take on traditional Warli themes, showing the interconnectedness of all life forms.',
    materials: ['Acrylic on canvas', 'Natural pigments'],
    techniques: ['Contemporary Warli', 'Mixed media'],
    dimensions: { width: 90, height: 60, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600',
        caption: 'Warli Tree of Life - Main View',
        isPrimary: true
      }
    ],
    price: 22000,
    isForSale: true,
    isOriginal: true,
    tags: ['tree of life', 'contemporary', 'nature'],
    category: 'Contemporary',
    culturalSignificance: 'Bridges traditional Warli art with contemporary themes and environmental consciousness.'
  },
  {
    title: 'Madhubani Nature Symphony',
    artform: 'Madhubani',
    description: 'Detailed Madhubani painting featuring birds, animals, and floral patterns.',
    story: 'Celebrates the beauty of nature through intricate Madhubani patterns and motifs.',
    materials: ['Natural dyes', 'Bamboo pen', 'Handmade paper'],
    techniques: ['Fine detailing', 'Nature motifs'],
    dimensions: { width: 75, height: 55, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600',
        caption: 'Madhubani Nature Symphony - Main View',
        isPrimary: true
      }
    ],
    price: 20000,
    isForSale: true,
    isOriginal: true,
    tags: ['nature', 'birds', 'floral patterns'],
    category: 'Traditional',
    culturalSignificance: 'Showcases the deep connection between Madhubani art and natural elements.'
  },
  {
    title: 'Pithora Tribal Gathering',
    artform: 'Pithora',
    description: 'Dynamic Pithora painting showing tribal community gatherings and celebrations.',
    story: 'Captures the spirit of tribal unity and community celebrations in traditional Pithora style.',
    materials: ['Natural pigments', 'Cow dung', 'Clay'],
    techniques: ['Community painting', 'Ritual art'],
    dimensions: { width: 85, height: 65, unit: 'cm' },
    yearCreated: 2023,
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600',
        caption: 'Pithora Tribal Gathering - Main View',
        isPrimary: true
      }
    ],
    price: 28000,
    isForSale: true,
    isOriginal: true,
    tags: ['community', 'gathering', 'celebration'],
    category: 'Traditional',
    culturalSignificance: 'Represents the communal nature of tribal societies and their celebrations.'
  }
];

const sampleWorkshops = [
  {
    title: 'Introduction to Warli Art',
    artform: 'Warli',
    description: 'Learn the basics of Warli painting including geometric patterns and traditional motifs.',
    detailedDescription: 'This workshop will cover the fundamental techniques of Warli art, including the use of rice paste, basic geometric shapes, and traditional motifs. Perfect for beginners who want to explore this ancient tribal art form.',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    duration: '3 hours',
    maxParticipants: 15,
    price: 1500,
    location: 'Mumbai Art Center',
    isOnline: false,
    materialsProvided: ['Rice paste', 'Brushes', 'Practice sheets'],
    materialsRequired: ['Canvas or paper', 'Pencil'],
    skillLevel: 'Beginner',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        caption: 'Warli Workshop Setup'
      }
    ],
    tags: ['beginner', 'traditional', 'geometric patterns']
  },
  {
    title: 'Advanced Madhubani Techniques',
    artform: 'Madhubani',
    description: 'Master advanced Madhubani painting techniques including fine line work and color blending.',
    detailedDescription: 'Advanced workshop focusing on intricate line work, color theory, and complex Madhubani patterns. Participants will learn advanced techniques used by master artists.',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    duration: '4 hours',
    maxParticipants: 12,
    price: 2500,
    location: 'Delhi Cultural Center',
    isOnline: false,
    materialsProvided: ['Natural dyes', 'Bamboo pens', 'Handmade paper'],
    materialsRequired: ['Fine brushes', 'Color palette'],
    skillLevel: 'Advanced',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        caption: 'Madhubani Advanced Workshop'
      }
    ],
    tags: ['advanced', 'fine art', 'traditional techniques']
  },
  {
    title: 'Pithora Ritual Art Online',
    artform: 'Pithora',
    description: 'Learn Pithora ritual art through our comprehensive online workshop.',
    detailedDescription: 'Online workshop covering the sacred aspects of Pithora art, including ritual preparation, traditional motifs, and spiritual significance. Live interaction with master artist.',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    duration: '2.5 hours',
    maxParticipants: 20,
    price: 1800,
    location: 'Online via Zoom',
    isOnline: true,
    meetingLink: 'https://zoom.us/j/123456789',
    materialsProvided: ['Digital resources', 'Reference images'],
    materialsRequired: ['Natural pigments', 'Canvas', 'Brushes'],
    skillLevel: 'Intermediate',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        caption: 'Pithora Online Workshop'
      }
    ],
    tags: ['online', 'ritual art', 'sacred motifs']
  },
  {
    title: 'Contemporary Warli Fusion',
    artform: 'Warli',
    description: 'Explore modern interpretations of Warli art with contemporary themes.',
    detailedDescription: 'Innovative workshop combining traditional Warli techniques with contemporary themes and modern materials. Learn to create fusion art that bridges tradition and modernity.',
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
    duration: '3.5 hours',
    maxParticipants: 18,
    price: 2000,
    location: 'Bangalore Art Studio',
    isOnline: false,
    materialsProvided: ['Acrylic paints', 'Canvas', 'Mixed media supplies'],
    materialsRequired: ['Sketchbook', 'Pencils'],
    skillLevel: 'Intermediate',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        caption: 'Contemporary Warli Workshop'
      }
    ],
    tags: ['contemporary', 'fusion', 'modern art']
  },
  {
    title: 'Madhubani for Beginners',
    artform: 'Madhubani',
    description: 'Perfect introduction to Madhubani art for complete beginners.',
    detailedDescription: 'Gentle introduction to Madhubani art covering basic patterns, simple motifs, and fundamental techniques. No prior art experience required.',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    duration: '2 hours',
    maxParticipants: 25,
    price: 1200,
    location: 'Chennai Art Academy',
    isOnline: false,
    materialsProvided: ['Basic supplies', 'Practice sheets', 'Reference materials'],
    materialsRequired: ['Paper', 'Pencils'],
    skillLevel: 'Beginner',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400',
        caption: 'Madhubani Beginners Workshop'
      }
    ],
    tags: ['beginner', 'introduction', 'basic techniques']
  },
  {
    title: 'Pithora Community Art',
    artform: 'Pithora',
    description: 'Experience the communal aspect of Pithora art creation.',
    detailedDescription: 'Unique workshop focusing on the communal nature of Pithora art, where participants work together to create a large-scale community artwork.',
    date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
    duration: '5 hours',
    maxParticipants: 30,
    price: 3000,
    location: 'Ahmedabad Cultural Center',
    isOnline: false,
    materialsProvided: ['Large canvas', 'All painting materials', 'Community workspace'],
    materialsRequired: ['Comfortable clothing', 'Enthusiasm'],
    skillLevel: 'All Levels',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        caption: 'Pithora Community Workshop'
      }
    ],
    tags: ['community', 'collaborative', 'large scale']
  }
];

// Initialize database
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // Clear existing data
    await User.deleteMany({});
    await Artist.deleteMany({});
    await Artwork.deleteMany({});
    await Workshop.deleteMany({});
    
    console.log('Cleared existing data');
    
    // Create users
    const createdUsers = [];
    for (const userData of sampleUsers) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const user = new User({
        ...userData,
        password: hashedPassword
      });
      await user.save();
      createdUsers.push(user);
      console.log(`Created user: ${user.name}`);
    }
    
    // Create artists
    const createdArtists = [];
    for (const artistData of sampleArtists) {
      const artist = new Artist(artistData);
      await artist.save();
      createdArtists.push(artist);
      console.log(`Created artist: ${artist.name}`);
    }
    
    // Create artworks
    for (let i = 0; i < sampleArtworks.length; i++) {
      const artworkData = sampleArtworks[i];
      const artist = createdArtists[i % createdArtists.length];
      
      const artwork = new Artwork({
        ...artworkData,
        artist: artist._id,
        status: 'Published'
      });
      await artwork.save();
      console.log(`Created artwork: ${artwork.title}`);
    }
    
    // Create workshops
    for (let i = 0; i < sampleWorkshops.length; i++) {
      const workshopData = sampleWorkshops[i];
      const artist = createdArtists[i % createdArtists.length];
      
      const workshop = new Workshop({
        ...workshopData,
        artist: artist._id,
        status: 'Published'
      });
      await workshop.save();
      console.log(`Created workshop: ${workshop.title}`);
    }
    
    console.log('Database initialization completed successfully!');
    console.log(`Created ${createdUsers.length} users`);
    console.log(`Created ${createdArtists.length} artists`);
    console.log(`Created ${sampleArtworks.length} artworks`);
    console.log(`Created ${sampleWorkshops.length} workshops`);
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };