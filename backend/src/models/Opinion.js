const { getDb } = require('../config/database');

const Opinion = {
  findByTopicId(topicId) {
    const db = getDb();
    return db.prepare(`
      SELECT o.*, u.name AS author_name
      FROM opinions o
      JOIN users u ON o.user_id = u.id
      WHERE o.topic_id = ?
      ORDER BY o.id ASC
    `).all(topicId) || [];
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM opinions WHERE id = ?').get(id);
  },

  create({ topicId, userId, content, visible, selectable }) {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO opinions (topic_id, user_id, content, visible, selectable) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(topicId, userId, content, visible ? 1 : 0, selectable ? 1 : 0);
    return db.prepare(`
      SELECT o.*, u.name AS author_name
      FROM opinions o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(Number(result.lastInsertRowid));
  },

  update(id, { content, visible, selectable }) {
    const db = getDb();
    const sets = [];
    const params = [];
    if (content !== undefined) { sets.push('content = ?'); params.push(content); }
    if (visible !== undefined) { sets.push('visible = ?'); params.push(visible ? 1 : 0); }
    if (selectable !== undefined) { sets.push('selectable = ?'); params.push(selectable ? 1 : 0); }
    if (sets.length === 0) return Opinion.findById(id);
    params.push(id);
    db.prepare(`UPDATE opinions SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    return db.prepare(`
      SELECT o.*, u.name AS author_name
      FROM opinions o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);
  },

  support(id, increment = true) {
    const db = getDb();
    if (increment) {
      db.prepare('UPDATE opinions SET support_count = support_count + 1 WHERE id = ?').run(id);
    } else {
      db.prepare('UPDATE opinions SET support_count = MAX(0, support_count - 1) WHERE id = ?').run(id);
    }
    return db.prepare(`
      SELECT o.*, u.name AS author_name
      FROM opinions o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `).get(id);
  },

  findUserSupport(topicId, userId) {
    const db = getDb();
    return db.prepare('SELECT * FROM supports WHERE topic_id = ? AND user_id = ?').get(topicId, userId);
  },

  createSupport(topicId, userId, opinionId) {
    const db = getDb();
    db.prepare('INSERT OR REPLACE INTO supports (topic_id, user_id, opinion_id) VALUES (?, ?, ?)').run(topicId, userId, opinionId);
  },

  deleteSupport(topicId, userId) {
    const db = getDb();
    db.prepare('DELETE FROM supports WHERE topic_id = ? AND user_id = ?').run(topicId, userId);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM opinions WHERE id = ?').run(id);
  }
};

module.exports = Opinion;
