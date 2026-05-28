const { getDb } = require('../config/database');

const Comment = {
  findById(id) {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, u.name AS author_name, u.avatar AS author_avatar
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(id);
  },

  findByTopicId(topicId) {
    const db = getDb();
    return db.prepare(`
      SELECT c.*, u.name AS author_name, u.avatar AS author_avatar,
             ru.name AS reply_to_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users ru ON c.reply_to_user_id = ru.id
      WHERE c.topic_id = ?
      ORDER BY c.id ASC
    `).all(topicId) || [];
  },

  create({ topicId, userId, content, parentId, replyToUserId }) {
    const db = getDb();
    const result = db.prepare(
      'INSERT INTO comments (topic_id, user_id, content, parent_id, reply_to_user_id) VALUES (?, ?, ?, ?, ?)'
    ).run(topicId, userId, content, parentId || null, replyToUserId || null);
    return db.prepare(`
      SELECT c.*, u.name AS author_name, u.avatar AS author_avatar,
             ru.name AS reply_to_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users ru ON c.reply_to_user_id = ru.id
      WHERE c.id = ?
    `).get(Number(result.lastInsertRowid));
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM comments WHERE id = ?').run(id);
  }
};

module.exports = Comment;
