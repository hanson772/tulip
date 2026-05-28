const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const log = require('./src/config/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging (API only)
app.use((req, res, next) => {
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    log.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [user:${req.userId || '-'}]`);
  });
  next();
});

// Initialize database
try {
  require('./src/config/database').getDb();
  log.info('SQLite database initialized');
} catch (err) {
  log.error('Database initialization error:', err.message);
}

// Seed admin user from environment variables
require('./src/config/seedAdmin')();

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
  log.info(`Server is running on port ${PORT}`);
});

// Flush logs on uncaught errors
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason?.message || reason);
});
