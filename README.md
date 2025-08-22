# Folk Art Heritage Platform

A comprehensive digital platform for preserving, promoting, and creating engagement around traditional Indian folk artforms - Warli, Pithora, and Madhubani. This platform connects master artists with art enthusiasts, collectors, and learners worldwide.

## 🌟 Features

### For Art Enthusiasts & Collectors
- **Discover Artworks**: Browse authentic folk art pieces from traditional artists
- **Artist Profiles**: Connect with master craftsmen and learn about their journey
- **Art Collections**: Create and manage personal art collections
- **Workshop Registration**: Learn directly from artists through workshops
- **Favorites & Reviews**: Save favorite artworks and leave reviews
- **Search & Filter**: Find artworks by artform, artist, price, and more

### For Artists
- **Artist Profiles**: Create detailed profiles showcasing your work and experience
- **Artwork Gallery**: Upload and manage your artwork portfolio
- **Workshop Hosting**: Create and manage art workshops
- **Direct Sales**: Sell artworks directly to collectors
- **Analytics**: Track views, likes, and engagement
- **Verification System**: Get verified as an authentic folk artist

### For Learners
- **Workshop Discovery**: Find workshops by artform, skill level, and location
- **Online & Offline Learning**: Participate in both virtual and in-person workshops
- **Skill Progression**: Track your learning journey across different artforms
- **Community**: Connect with fellow learners and artists

## 🎨 Supported Artforms

### Warli Art
- **Origin**: Maharashtra, India
- **Characteristics**: Simple geometric shapes, tribal motifs, daily life depictions
- **Materials**: Rice paste, natural pigments, cow dung

### Madhubani Art
- **Origin**: Bihar, India
- **Characteristics**: Intricate patterns, mythological themes, nature motifs
- **Materials**: Natural dyes, bamboo pen, handmade paper

### Pithora Art
- **Origin**: Gujarat, India
- **Characteristics**: Sacred ritual art, tribal deities, vibrant colors
- **Materials**: Natural pigments, cow dung, clay

## 🚀 Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **JWT**: Authentication
- **bcryptjs**: Password hashing

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Interactive functionality
- **Responsive Design**: Mobile-first approach

### Key Libraries
- **Font Awesome**: Icons
- **Google Fonts**: Typography (Poppins, Playfair Display)

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v14 or higher)
- **MongoDB** (v4.4 or higher)
- **npm** or **yarn**

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd folk-art-heritage-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
MONGODB_URI=mongodb://localhost:27017/folk_art_heritage
JWT_SECRET=your-secret-key-here
PORT=3000
NODE_ENV=development
```

### 4. Database Setup
Make sure MongoDB is running on your system, then initialize the database with sample data:
```bash
npm run init-data
```

### 5. Start the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The application will be available at `http://localhost:3000`

## 📊 Database Schema

### User Model
- Basic user information (name, email, password)
- Role-based access (user, artist, admin, curator)
- Art preferences and favorites
- Collections and workshop registrations

### Artist Model
- Artist profile and bio
- Artform specialization
- Awards and recognition
- Social media links
- Gallery and workshop management

### Artwork Model
- Artwork details and description
- Materials and techniques used
- Pricing and availability
- Cultural significance
- Likes, views, and comments

### Workshop Model
- Workshop details and schedule
- Participant management
- Pricing and materials
- Reviews and ratings

## 🔐 Authentication & Authorization

The platform uses JWT (JSON Web Tokens) for authentication:

- **Registration**: Users can register as art enthusiasts or artists
- **Login**: Secure login with email and password
- **Role-based Access**: Different permissions for users, artists, and admins
- **Protected Routes**: API endpoints are protected based on user roles

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile

### Artists
- `GET /api/artists` - Get all artists
- `GET /api/artists/:id` - Get artist by ID
- `POST /api/artists` - Create artist profile
- `PUT /api/artists/:id` - Update artist profile
- `POST /api/artists/:id/follow` - Follow/unfollow artist
- `GET /api/artists/featured/list` - Get featured artists

### Artworks
- `GET /api/artworks` - Get all artworks
- `GET /api/artworks/:id` - Get artwork by ID
- `POST /api/artworks` - Create artwork
- `PUT /api/artworks/:id` - Update artwork
- `POST /api/artworks/:id/like` - Like/unlike artwork
- `GET /api/artworks/featured/list` - Get featured artworks

### Workshops
- `GET /api/workshops` - Get all workshops
- `GET /api/workshops/:id` - Get workshop by ID
- `POST /api/workshops` - Create workshop
- `POST /api/workshops/:id/register` - Register for workshop
- `GET /api/workshops/upcoming/list` - Get upcoming workshops

## 🎨 Frontend Features

### Responsive Design
- Mobile-first approach
- CSS Grid and Flexbox layouts
- Cultural color palette inspired by Indian folk art
- Smooth animations and transitions

### Interactive Elements
- Modal dialogs for login/registration
- Dynamic content loading
- Real-time search and filtering
- Toast notifications
- Loading spinners

### Cultural Elements
- Traditional art patterns and motifs
- Cultural color schemes
- Indian typography and design elements
- Folk art-inspired animations

## 📱 Responsive Design

The platform is fully responsive and works seamlessly across:
- **Desktop** (1200px+)
- **Tablet** (768px - 1199px)
- **Mobile** (320px - 767px)

## 🔧 Development

### Project Structure
```
folk-art-heritage-platform/
├── models/           # Database models
├── routes/           # API routes
├── middleware/       # Custom middleware
├── public/           # Static files (HTML, CSS, JS)
├── init-data.js      # Database initialization
├── server.js         # Main server file
├── package.json      # Dependencies and scripts
└── README.md         # Project documentation
```

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run init-data  # Initialize database with sample data
```

### Code Style
- Consistent indentation (2 spaces)
- Descriptive variable and function names
- Comprehensive error handling
- JSDoc comments for functions
- Modular code organization

## 🧪 Testing

To run tests (when implemented):
```bash
npm test
```

## 🚀 Deployment

### Environment Variables for Production
```env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-secret-key
PORT=3000
NODE_ENV=production
```

### Deployment Platforms
- **Heroku**: Easy deployment with Git integration
- **Vercel**: Serverless deployment
- **AWS**: Scalable cloud deployment
- **DigitalOcean**: VPS deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Traditional Indian folk artists for preserving these art forms
- Cultural heritage organizations for documentation
- Open source community for tools and libraries
- Art enthusiasts and collectors for supporting folk art

## 📞 Support

For support and questions:
- Email: support@folkartheritage.com
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🔮 Future Enhancements

- **AI Art Recognition**: Identify artforms and styles
- **Virtual Reality Workshops**: Immersive learning experiences
- **Blockchain Integration**: Digital art ownership and provenance
- **Mobile App**: Native iOS and Android applications
- **Live Streaming**: Real-time artist demonstrations
- **Marketplace**: Enhanced e-commerce features
- **Community Features**: Forums and discussion boards
- **Analytics Dashboard**: Advanced insights for artists

---

**Made with ❤️ for preserving India's cultural heritage**