# Smart Waste Management & Recycling Platform

A comprehensive digital platform that helps cities manage waste efficiently through citizen engagement, AI-powered waste segregation, gamification, and real-time analytics.

## 🌟 Features

### For Citizens
- **Report Waste Issues**: Report overflowing bins, request pickups, and report illegal dumping
- **AI Waste Segregation**: Upload images to get AI-powered waste classification and disposal guidance
- **Gamification & Rewards**: Earn points for eco-friendly actions and redeem rewards
- **Find Nearby Bins**: Locate waste bins and recycling centers using interactive maps
- **Track Impact**: Monitor personal environmental impact and community contributions

### For Municipal Authorities
- **Real-time Dashboard**: Monitor waste management operations with live analytics
- **Route Optimization**: Optimize collection routes based on bin fill levels and locations
- **Citizen Reports Management**: Track and respond to citizen reports efficiently
- **Environmental Impact Tracking**: Monitor community-wide recycling and waste reduction
- **Alert System**: Receive alerts for overflowing bins and maintenance needs

### Technical Features
- **IoT Integration**: Support for smart bin sensors (fill level, temperature, humidity)
- **Google Maps Integration**: Interactive maps for bin locations and route planning
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Real-time Updates**: Live data updates using modern web technologies
- **Secure Authentication**: JWT-based authentication with role-based access control

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Google Maps API Key (optional, for maps functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-waste-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/smart_waste_management
   JWT_SECRET=your_super_secret_jwt_key_here
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Initialize sample data**
   ```bash
   node init-data.js
   ```

6. **Start the application**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

7. **Access the application**
   - Citizen Portal: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin

## 👥 Default Login Credentials

After running the initialization script, you can use these credentials:

### Admin Account
- **Email**: admin@ecowaste.com
- **Password**: admin123
- **Role**: Administrator

### Citizen Accounts
- **Email**: john@example.com
- **Password**: user123
- **Role**: Citizen

- **Email**: jane@example.com
- **Password**: user123
- **Role**: Citizen

### Collector Account
- **Email**: collector@ecowaste.com
- **Password**: collector123
- **Role**: Waste Collector

## 📱 Usage Guide

### For Citizens

1. **Registration/Login**
   - Create an account or login with existing credentials
   - Complete your profile with location information

2. **Report Issues**
   - Navigate to the "Report" section
   - Select issue type (overflowing bin, pickup request, etc.)
   - Add description and location
   - Upload photos (optional)
   - Submit to earn points

3. **AI Waste Assistant**
   - Go to "AI Assistant" section
   - Upload a photo of waste item
   - Get AI-powered classification and disposal guidance
   - Search for specific waste items

4. **Earn Rewards**
   - Collect points by reporting issues and proper waste disposal
   - Browse available rewards in the "Rewards" section
   - Redeem points for discounts, coupons, and eco-friendly products
   - Track your progress on the leaderboard

5. **Find Bins**
   - Use the "Map" section to locate nearby waste bins
   - Filter by bin type (recyclable, biodegradable, hazardous, general)
   - Get directions to the nearest appropriate bin

### For Administrators

1. **Dashboard Overview**
   - Monitor key metrics (reports, bins, users, resolution rates)
   - View real-time charts and trends
   - Check critical alerts and system status

2. **Manage Reports**
   - Review citizen reports by status, type, and priority
   - Assign reports to collectors
   - Update report status and add resolution notes
   - Track response times and citizen feedback

3. **Bin Management**
   - Monitor bin fill levels and status
   - Schedule collections and maintenance
   - View bin locations on interactive map
   - Receive alerts for overflowing bins

4. **User Management**
   - View registered users and their activity
   - Monitor user engagement and points
   - Manage user accounts and permissions

5. **Rewards System**
   - Create and manage reward offerings
   - Set point requirements and validity periods
   - Track redemption statistics
   - Partner with local businesses for rewards

6. **Analytics**
   - View environmental impact metrics
   - Analyze waste collection efficiency
   - Generate reports for stakeholders
   - Optimize routes and schedules

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Authentication**: JWT-based with role-based access control
- **Database**: MongoDB with Mongoose ODM
- **API**: RESTful APIs for all operations
- **File Upload**: Multer for image handling
- **Security**: CORS, input validation, and sanitization

### Frontend (HTML + CSS + JavaScript)
- **Responsive Design**: Mobile-first approach with CSS Grid and Flexbox
- **Interactive Maps**: Google Maps API integration
- **Charts**: Chart.js for data visualization
- **Real-time Updates**: Fetch API for dynamic content loading
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Database Schema
- **Users**: Authentication, profile, points, and recycling stats
- **Reports**: Citizen reports with location, images, and status tracking
- **WasteBins**: Bin locations, types, fill levels, and sensor data
- **Rewards**: Reward catalog with redemption tracking
- **UserRewards**: Individual reward redemptions and usage

## 🔧 Configuration

### Google Maps API Setup
1. Get a Google Maps API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Add the API key to your `.env` file
4. Update the script tag in HTML files with your API key

### MongoDB Configuration
- Default connection: `mongodb://localhost:27017/smart_waste_management`
- For production, use MongoDB Atlas or your preferred cloud MongoDB service
- Update the `MONGODB_URI` in your `.env` file

### Environment Variables
```bash
PORT=3000                                    # Server port
MONGODB_URI=mongodb://localhost:27017/...   # MongoDB connection string
JWT_SECRET=your_jwt_secret                   # JWT signing secret
GOOGLE_MAPS_API_KEY=your_api_key            # Google Maps API key
NODE_ENV=development                         # Environment (development/production)
```

## 🧪 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Reports
- `GET /api/reports` - Get reports (with filtering)
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id/status` - Update report status
- `POST /api/reports/:id/feedback` - Submit citizen feedback

### Waste Bins
- `GET /api/bins` - Get bins (with location filtering)
- `POST /api/bins` - Create new bin (admin only)
- `GET /api/bins/:id` - Get specific bin
- `PUT /api/bins/:id` - Update bin information
- `POST /api/bins/:id/collect` - Mark bin as collected

### Rewards
- `GET /api/rewards` - Get available rewards
- `POST /api/rewards` - Create new reward (admin only)
- `POST /api/rewards/:id/redeem` - Redeem reward
- `GET /api/rewards/my-rewards` - Get user's rewards
- `GET /api/rewards/leaderboard` - Get community leaderboard

### AI Assistant
- `POST /api/ai/classify` - Classify waste image
- `GET /api/ai/guidelines` - Get waste segregation guidelines
- `GET /api/ai/suggest/:query` - Search waste guidelines

### Analytics
- `GET /api/analytics/dashboard` - Dashboard overview data
- `GET /api/analytics/environmental-impact` - Environmental metrics
- `GET /api/analytics/my-stats` - User-specific statistics

## 🎨 Customization

### Styling
- Main styles: `/public/styles.css`
- Admin styles: `/public/admin-styles.css`
- Color scheme can be customized by modifying CSS custom properties
- Responsive breakpoints: 768px (mobile), 1024px (tablet)

### Adding New Features
1. **Backend**: Add new routes in `/routes/` directory
2. **Frontend**: Update HTML structure and add JavaScript handlers
3. **Database**: Create new models in `/models/` directory
4. **API**: Update API documentation and test endpoints

## 🚀 Deployment

### Production Setup
1. **Environment Variables**
   ```bash
   NODE_ENV=production
   MONGODB_URI=your_production_mongodb_uri
   JWT_SECRET=your_strong_production_secret
   ```

2. **Build and Start**
   ```bash
   npm install --production
   npm start
   ```

3. **Process Management** (recommended)
   ```bash
   npm install -g pm2
   pm2 start server.js --name "waste-management"
   pm2 startup
   pm2 save
   ```

### Deployment Platforms
- **Heroku**: Ready for deployment with included `Procfile`
- **DigitalOcean**: Use App Platform or Droplets
- **AWS**: Deploy on EC2, ECS, or Elastic Beanstalk
- **Google Cloud**: Use App Engine or Compute Engine

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Chart.js for beautiful data visualizations
- Google Maps API for location services
- Font Awesome for icons
- MongoDB for database solutions
- All contributors and testers

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@ecowaste.com
- Documentation: Check the `/docs` folder for detailed guides

---

**Made with 💚 for a cleaner, more sustainable future**