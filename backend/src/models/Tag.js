const { getDb } = require('../config/database');

const Tag = {
  findAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() || [];
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM tags WHERE id = ?').get(id);
  },

  create(name) {
    const db = getDb();
    const trimmed = (name || '').trim().slice(0, 20);
    if (!trimmed) return null;
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(trimmed);
    return { id: Number(result.lastInsertRowid), name: trimmed };
  },

  update(id, name) {
    const db = getDb();
    const trimmed = (name || '').trim().slice(0, 20);
    if (!trimmed) return null;
    db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(trimmed, id);
    return { id, name: trimmed };
  },

  delete(id) {
    const db = getDb();
    db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  },

  findByTopicId(topicId) {
    const db = getDb();
    return db.prepare(`
      SELECT t.id, t.name
      FROM tags t
      JOIN topic_tags tt ON t.id = tt.tag_id
      WHERE tt.topic_id = ?
      ORDER BY t.name ASC
    `).all(topicId) || [];
  },

  findOrCreate(name) {
    const db = getDb();
    const trimmed = (name || '').trim().slice(0, 20);
    if (!trimmed) return null;
    let row = db.prepare('SELECT id FROM tags WHERE name = ?').get(trimmed);
    if (row) return row;
    const result = db.prepare('INSERT INTO tags (name) VALUES (?)').run(trimmed);
    return { id: Number(result.lastInsertRowid) };
  },

  setTopicTags(topicId, tagNames) {
    const db = getDb();
    db.exec('BEGIN');
    try {
      db.prepare('DELETE FROM topic_tags WHERE topic_id = ?').run(topicId);
      const names = (tagNames || []).filter(n => (n || '').trim());
      for (const name of names) {
        const tag = Tag.findOrCreate(name);
        if (tag) {
          db.prepare('INSERT OR IGNORE INTO topic_tags (topic_id, tag_id) VALUES (?, ?)').run(topicId, tag.id);
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
};

module.exports = Tag;
