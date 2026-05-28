const Favorite = require('../models/Favorite');

const toggleFavorite = (req, res) => {
  try {
    const topicId = Number(req.params.topicId);
    const userId = req.userId;

    const existing = Favorite.findOne(userId, topicId);
    if (existing) {
      Favorite.delete(userId, topicId);
      return res.json({ favorited: false });
    } else {
      Favorite.create(userId, topicId);
      return res.json({ favorited: true });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error toggling favorite' });
  }
};

const checkFavorite = (req, res) => {
  try {
    const topicId = Number(req.params.topicId);
    const userId = req.userId;
    const existing = Favorite.findOne(userId, topicId);
    res.json({ favorited: !!existing });
  } catch (error) {
    res.status(500).json({ message: 'Server error checking favorite' });
  }
};

const getFavorites = (req, res) => {
  try {
    const favorites = Favorite.findByUserId(req.userId);
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
};

module.exports = { toggleFavorite, checkFavorite, getFavorites };
