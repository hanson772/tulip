const { getDb } = require('../config/database');

const Favorite = {
  findByUserId(userId) {
    const db = getDb();
    return db.prepare(`
      SELECT f.id, f.topic_id, f.created_at
      FROM favorites f
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(userId) || [];
  },

  findOne(userId, topicId) {
    const db = getDb();
    return db.prepare('SELECT id FROM favorites WHERE user_id = ? AND topic_id = ?').get(userId, topicId);
  },

  create(userId, topicId) {
    const db = getDb();
    const result = db.prepare('INSERT INTO favorites (user_id, topic_id) VALUES (?, ?)').run(userId, topicId);
    return { id: Number(result.lastInsertRowid), user_id: userId, topic_id: topicId };
  },

  delete(userId, topicId) {
    const db = getDb();
    db.prepare('DELETE FROM favorites WHERE user_id = ? AND topic_id = ?').run(userId, topicId);
  }
};

module.exports = Favorite;
