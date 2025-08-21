const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const WasteBin = require('./models/WasteBin');
const { Reward } = require('./models/Reward');
require('dotenv').config();

// Sample data
const sampleUsers = [
    {
        name: 'Admin User',
        email: 'admin@ecowaste.com',
        password: 'admin123',
        role: 'admin',
        location: {
            address: 'City Hall, Downtown',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            ward: 'Central',
            city: 'San Francisco'
        },
        points: 0
    },
    {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'user123',
        role: 'citizen',
        location: {
            address: '123 Green Street',
            coordinates: { lat: 37.7849, lng: -122.4094 },
            ward: 'North',
            city: 'San Francisco'
        },
        points: 2500,
        level: 'Gold',
        recyclingStats: {
            totalReports: 15,
            recyclableItems: 45,
            biodegradableItems: 30,
            hazardousItems: 8
        }
    },
    {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'user123',
        role: 'citizen',
        location: {
            address: '456 Eco Avenue',
            coordinates: { lat: 37.7649, lng: -122.4294 },
            ward: 'South',
            city: 'San Francisco'
        },
        points: 1800,
        level: 'Silver',
        recyclingStats: {
            totalReports: 12,
            recyclableItems: 35,
            biodegradableItems: 25,
            hazardousItems: 5
        }
    },
    {
        name: 'Mike Johnson',
        email: 'mike@example.com',
        password: 'user123',
        role: 'citizen',
        location: {
            address: '789 Sustainable Lane',
            coordinates: { lat: 37.7549, lng: -122.4394 },
            ward: 'East',
            city: 'San Francisco'
        },
        points: 850,
        level: 'Bronze',
        recyclingStats: {
            totalReports: 8,
            recyclableItems: 20,
            biodegradableItems: 15,
            hazardousItems: 3
        }
    },
    {
        name: 'Waste Collector',
        email: 'collector@ecowaste.com',
        password: 'collector123',
        role: 'collector',
        location: {
            address: 'Waste Management Facility',
            coordinates: { lat: 37.7449, lng: -122.4494 },
            ward: 'Industrial',
            city: 'San Francisco'
        },
        points: 0
    }
];

const sampleBins = [
    {
        binId: 'BIN-001',
        location: {
            address: '100 Market Street, San Francisco',
            coordinates: { lat: 37.7749, lng: -122.4194 },
            ward: 'Central',
            landmark: 'Near City Hall'
        },
        binType: 'recyclable',
        capacity: 100,
        currentLevel: 85,
        status: 'warning',
        lastCollected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        collectionFrequency: 'alternate',
        sensorData: {
            temperature: 22,
            humidity: 65,
            lastUpdated: new Date()
        }
    },
    {
        binId: 'BIN-002',
        location: {
            address: '200 Mission Street, San Francisco',
            coordinates: { lat: 37.7849, lng: -122.4094 },
            ward: 'North',
            landmark: 'Transit Station'
        },
        binType: 'biodegradable',
        capacity: 100,
        currentLevel: 45,
        status: 'normal',
        lastCollected: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        collectionFrequency: 'daily',
        sensorData: {
            temperature: 25,
            humidity: 70,
            lastUpdated: new Date()
        }
    },
    {
        binId: 'BIN-003',
        location: {
            address: '300 Folsom Street, San Francisco',
            coordinates: { lat: 37.7649, lng: -122.4294 },
            ward: 'South',
            landmark: 'Shopping Center'
        },
        binType: 'general',
        capacity: 100,
        currentLevel: 95,
        status: 'critical',
        lastCollected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        collectionFrequency: 'alternate',
        sensorData: {
            temperature: 28,
            humidity: 60,
            lastUpdated: new Date()
        }
    },
    {
        binId: 'BIN-004',
        location: {
            address: '400 Howard Street, San Francisco',
            coordinates: { lat: 37.7549, lng: -122.4394 },
            ward: 'East',
            landmark: 'Office Complex'
        },
        binType: 'hazardous',
        capacity: 100,
        currentLevel: 30,
        status: 'normal',
        lastCollected: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        collectionFrequency: 'weekly',
        sensorData: {
            temperature: 20,
            humidity: 55,
            lastUpdated: new Date()
        }
    },
    {
        binId: 'BIN-005',
        location: {
            address: '500 Pine Street, San Francisco',
            coordinates: { lat: 37.7889, lng: -122.4089 },
            ward: 'North',
            landmark: 'Park Entrance'
        },
        binType: 'recyclable',
        capacity: 100,
        currentLevel: 70,
        status: 'warning',
        lastCollected: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        collectionFrequency: 'alternate',
        sensorData: {
            temperature: 23,
            humidity: 68,
            lastUpdated: new Date()
        }
    }
];

const sampleRewards = [
    {
        title: '20% Off Eco-Friendly Products',
        description: 'Get 20% discount on all eco-friendly products at participating stores',
        category: 'discount',
        pointsRequired: 500,
        value: '20% off',
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        maxRedemptions: 100,
        currentRedemptions: 25,
        partnerCompany: {
            name: 'GreenMart',
            logo: '/images/greenmart-logo.png',
            contact: 'contact@greenmart.com'
        },
        terms: 'Valid on purchases above $50. Cannot be combined with other offers.',
        isActive: true
    },
    {
        title: 'Free Coffee at EcoCafe',
        description: 'Enjoy a free cup of organic coffee at any EcoCafe location',
        category: 'coupon',
        pointsRequired: 200,
        value: 'Free Coffee',
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        maxRedemptions: 200,
        currentRedemptions: 45,
        partnerCompany: {
            name: 'EcoCafe',
            logo: '/images/ecocafe-logo.png',
            contact: 'hello@ecocafe.com'
        },
        terms: 'One redemption per customer per day. Valid for regular size coffee only.',
        isActive: true
    },
    {
        title: 'Eco Warrior Badge',
        description: 'Digital badge recognizing your contribution to environmental protection',
        category: 'badge',
        pointsRequired: 1000,
        value: 'Digital Badge',
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        maxRedemptions: -1, // Unlimited
        currentRedemptions: 12,
        terms: 'Badge will be displayed on your profile and can be shared on social media.',
        isActive: true
    },
    {
        title: 'Reusable Water Bottle',
        description: 'High-quality stainless steel water bottle with EcoWaste branding',
        category: 'gift',
        pointsRequired: 800,
        value: 'Water Bottle',
        validUntil: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
        maxRedemptions: 50,
        currentRedemptions: 8,
        terms: 'Free shipping included. Allow 5-7 business days for delivery.',
        isActive: true
    },
    {
        title: 'Tree Planting Certificate',
        description: 'We will plant a tree in your name and send you a certificate',
        category: 'certificate',
        pointsRequired: 1500,
        value: 'Tree Planting',
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 180 days from now
        maxRedemptions: 100,
        currentRedemptions: 5,
        partnerCompany: {
            name: 'Green Future Foundation',
            logo: '/images/green-future-logo.png',
            contact: 'plant@greenfuture.org'
        },
        terms: 'Tree will be planted within 30 days. Certificate sent via email.',
        isActive: true
    }
];

async function initializeDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart_waste_management', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await WasteBin.deleteMany({});
        await Reward.deleteMany({});
        
        console.log('Cleared existing data');

        // Insert sample users
        const users = [];
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            users.push(user);
        }
        console.log(`Inserted ${users.length} users`);

        // Insert sample bins
        for (const binData of sampleBins) {
            const bin = new WasteBin(binData);
            bin.updateStatus();
            bin.calculateNextCollection();
            await bin.save();
        }
        console.log(`Inserted ${sampleBins.length} waste bins`);

        // Insert sample rewards
        for (const rewardData of sampleRewards) {
            const reward = new Reward(rewardData);
            await reward.save();
        }
        console.log(`Inserted ${sampleRewards.length} rewards`);

        console.log('\n✅ Database initialization completed successfully!');
        console.log('\nSample login credentials:');
        console.log('Admin: admin@ecowaste.com / admin123');
        console.log('Citizen: john@example.com / user123');
        console.log('Collector: collector@ecowaste.com / collector123');
        
    } catch (error) {
        console.error('Error initializing database:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        process.exit(0);
    }
}

// Run initialization if this file is executed directly
if (require.main === module) {
    initializeDatabase();
}

module.exports = { initializeDatabase };