const express = require('express');
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

// Routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

// API routes
app.use('/api/users', require('./src/routes/userRoutes'));
app.use('/api/posts', require('./src/routes/postRoutes'));
app.use('/api/topics', require('./src/routes/topicRoutes'));
app.use('/api/tags', require('./src/routes/tagRoutes'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
