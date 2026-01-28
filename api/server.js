const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Import routes
const trailRoutes = require('./routes/trails');
const breweryRoutes = require('./routes/breweries');
const validationRoutes = require('./routes/validation');
const ratingRoutes = require('./routes/ratings');
const recommendationRoutes = require('./routes/recommendations');
const adminRoutes = require('./routes/admin');

// API Routes
app.use('/api/trails', trailRoutes);
app.use('/api/breweries', breweryRoutes);
app.use('/api/validate', validationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    success: false, 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong' 
      : err.message 
  });
});

app.listen(PORT, () => {
  console.log(`
🍺 AleTrail Platform Server Running
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 Port: ${PORT}
🌍 URL: http://localhost:${PORT}
📊 API: http://localhost:${PORT}/api
🔐 Environment: ${process.env.NODE_ENV || 'development'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
