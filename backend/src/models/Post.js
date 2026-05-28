const { getDb } = require('../config/database');

const Post = {
  findByUserId(userId) {
    const db = getDb();
    const stmt = db.prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) || [];
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  },

  create({ userId, content }) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO posts (user_id, content) VALUES (?, ?)');
    const result = stmt.run(userId, content);
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(result.lastInsertRowid));
  },

  update(id, { content }) {
    const db = getDb();
    db.prepare("UPDATE posts SET content = ?, updated_at = datetime('now') WHERE id = ?").run(content, id);
    return db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM posts WHERE id = ?').run(id);
  }
};

module.exports = Post;
