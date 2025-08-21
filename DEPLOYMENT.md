# Deployment Guide - Smart Waste Management Platform

## 🚀 Quick Deployment Steps

### 1. Prerequisites Installation

**MongoDB Installation:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mongodb

# macOS with Homebrew
brew install mongodb-community

# Windows - Download from https://www.mongodb.com/try/download/community
```

**Node.js Installation:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS with Homebrew
brew install node

# Windows - Download from https://nodejs.org/
```

### 2. Application Setup

```bash
# Clone/Download the project
cd smart-waste-management

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start MongoDB
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS

# Initialize sample data
npm run init-data

# Start the application
npm start
```

### 3. Access Points

- **Citizen Portal**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin

### 4. Default Login Credentials

| Role | Email | Password | Access |
|------|-------|----------|---------|
| Admin | admin@ecowaste.com | admin123 | Full system access |
| Citizen | john@example.com | user123 | Report, AI assistant, rewards |
| Collector | collector@ecowaste.com | collector123 | Collection management |

## 🌐 Production Deployment

### Option 1: Traditional Server (VPS/Dedicated)

```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "waste-management"

# Set up PM2 to restart on system reboot
pm2 startup
pm2 save

# Configure Nginx reverse proxy (optional)
sudo apt install nginx
# Configure nginx to proxy to localhost:3000
```

### Option 2: Heroku Deployment

```bash
# Install Heroku CLI
npm install -g heroku

# Login and create app
heroku login
heroku create your-waste-management-app

# Set environment variables
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_production_secret
heroku config:set GOOGLE_MAPS_API_KEY=your_api_key

# Deploy
git add .
git commit -m "Initial deployment"
git push heroku main
```

### Option 3: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongo:27017/smart_waste_management
      - JWT_SECRET=your_jwt_secret
    depends_on:
      - mongo
  
  mongo:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Deploy with Docker:
```bash
docker-compose up -d
```

## 🔧 Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
MONGODB_URI=mongodb://localhost:27017/smart_waste_management
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/database

# Security
JWT_SECRET=your_super_secure_jwt_secret_minimum_32_characters

# External APIs
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domains (production security)
6. Add the key to your `.env` file

### MongoDB Atlas Setup (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (0.0.0.0/0 for all IPs in development)
5. Get connection string and update `MONGODB_URI`

## 🔒 Security Checklist

### Production Security

- [ ] Change all default passwords
- [ ] Use strong JWT secret (32+ characters)
- [ ] Enable HTTPS with SSL certificate
- [ ] Restrict Google Maps API key to your domain
- [ ] Set up MongoDB authentication
- [ ] Configure firewall rules
- [ ] Enable rate limiting
- [ ] Set up monitoring and logging
- [ ] Regular security updates

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring

### Application Monitoring

```bash
# View PM2 processes
pm2 list

# View logs
pm2 logs waste-management

# Monitor resources
pm2 monit

# Restart application
pm2 restart waste-management
```

### Database Monitoring

```bash
# MongoDB status
sudo systemctl status mongodb

# MongoDB logs
sudo journalctl -u mongodb

# Connect to MongoDB shell
mongo
```

## 🔄 Updates and Maintenance

### Application Updates

```bash
# Pull latest changes
git pull origin main

# Install new dependencies
npm install

# Restart application
pm2 restart waste-management
```

### Database Backup

```bash
# Create backup
mongodump --db smart_waste_management --out /backup/$(date +%Y%m%d)

# Restore backup
mongorestore --db smart_waste_management /backup/20240101/smart_waste_management
```

## 🚨 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
```bash
# Check if MongoDB is running
sudo systemctl status mongodb

# Start MongoDB
sudo systemctl start mongodb

# Check MongoDB logs
sudo journalctl -u mongodb
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

**Permission Denied**
```bash
# Fix file permissions
chmod +x server.js
chown -R $USER:$USER /path/to/app
```

### Performance Optimization

1. **Enable Gzip Compression**
2. **Set up CDN for static assets**
3. **Implement database indexing**
4. **Use Redis for session storage**
5. **Enable caching headers**

## 📞 Support

For deployment support:
- Check the main README.md for detailed documentation
- Review server logs for error details
- Ensure all environment variables are correctly set
- Verify database connectivity
- Check firewall and security group settings

---

**Happy Deploying! 🌱**