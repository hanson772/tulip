const express = require('express');
const router = express.Router();
const { toggleFavorite, checkFavorite, getFavorites } = require('../controllers/favoriteController');
const { auth } = require('../middleware/auth');

router.get('/', auth, getFavorites);
router.get('/:topicId', auth, checkFavorite);
router.post('/:topicId', auth, toggleFavorite);

module.exports = router;
