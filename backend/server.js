const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Initialize database
try {
  require('./src/config/database').getDb();
  console.log('SQLite database initialized');
} catch (err) {
  console.error('Database initialization error:', err);
}

// API routes
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/topics', require('./src/routes/topicRoutes'));
app.use('/api/tags', require('./src/routes/tagRoutes'));
app.use('/api/favorites', require('./src/routes/favoriteRoutes'));
app.use('/api/roles', require('./src/routes/roleRoutes'));

// Serve built frontend static files
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
