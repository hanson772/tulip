const { getDb } = require('../config/database');

const BASE_SELECT = `
  SELECT t.*, u.name AS author_name, u.avatar AS author_avatar,
    (SELECT COUNT(*) FROM opinions WHERE topic_id = t.id) AS opinion_count
  FROM topics t
  JOIN users u ON t.user_id = u.id
`;

function _attachTags(topics) {
  if (!topics || topics.length === 0) return topics;
  const db = getDb();
  const ids = topics.map(t => t.id);
  const placeholders = ids.map(() => '?').join(',');
  const tagRows = db.prepare(`
    SELECT tt.topic_id, t.id AS tag_id, t.name
    FROM topic_tags tt
    JOIN tags t ON t.id = tt.tag_id
    WHERE tt.topic_id IN (${placeholders})
    ORDER BY t.name
  `).all(...ids) || [];
  const tagMap = {};
  for (const row of tagRows) {
    if (!tagMap[row.topic_id]) tagMap[row.topic_id] = [];
    tagMap[row.topic_id].push({ id: row.tag_id, name: row.name });
  }
  for (const topic of topics) {
    topic.tags = tagMap[topic.id] || [];
  }
  return topics;
}

const Topic = {
  findAll() {
    const db = getDb();
    const topics = db.prepare(`${BASE_SELECT} WHERE t.status = 'published' ORDER BY t.created_at DESC`).all() || [];
    return _attachTags(topics);
  },

  findByTag(tagName) {
    const db = getDb();
    const topics = db.prepare(`
      ${BASE_SELECT}
      JOIN topic_tags tt ON t.id = tt.topic_id
      JOIN tags ta ON tt.tag_id = ta.id
      WHERE t.status = 'published' AND ta.name = ?
      ORDER BY t.created_at DESC
    `).all(tagName) || [];
    return _attachTags(topics);
  },

  findAllByUser(userId) {
    const db = getDb();
    const topics = db.prepare(`${BASE_SELECT} WHERE t.user_id = ? ORDER BY t.created_at DESC`).all(userId) || [];
    return _attachTags(topics);
  },

  findByStatus(userId, statuses) {
    const db = getDb();
    const placeholders = statuses.map(() => '?').join(',');
    const topics = db.prepare(`${BASE_SELECT} WHERE t.user_id = ? AND t.status IN (${placeholders}) ORDER BY t.created_at DESC`).all(userId, ...statuses) || [];
    return _attachTags(topics);
  },

  findById(id) {
    const db = getDb();
    const topic = db.prepare(`
      SELECT t.*, u.name AS author_name, u.avatar AS author_avatar
      FROM topics t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(id);
    if (!topic) return null;
    topic.opinions = db.prepare(`
      SELECT o.*, u.name AS author_name, u.avatar AS author_avatar
      FROM opinions o
      JOIN users u ON o.user_id = u.id
      WHERE o.topic_id = ?
      ORDER BY o.created_at DESC
    `).all(id) || [];
    topic.tags = db.prepare(`
      SELECT t.id, t.name
      FROM tags t
      JOIN topic_tags tt ON t.id = tt.tag_id
      WHERE tt.topic_id = ?
      ORDER BY t.name
    `).all(id) || [];
    topic.comments = db.prepare(`
      SELECT c.*, u.name AS author_name, u.avatar AS author_avatar,
             ru.name AS reply_to_name
      FROM comments c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN users ru ON c.reply_to_user_id = ru.id
      WHERE c.topic_id = ?
      ORDER BY c.id ASC
    `).all(id) || [];
    return topic;
  },

  create({ userId, title, content, deadline }) {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO topics (user_id, title, content, deadline) VALUES (?, ?, ?, ?)');
    const result = stmt.run(userId, title, content, deadline || null);
    return db.prepare('SELECT * FROM topics WHERE id = ?').get(Number(result.lastInsertRowid));
  },

  update(id, { title, content, deadline }) {
    const db = getDb();
    db.prepare("UPDATE topics SET title = ?, content = ?, deadline = ?, updated_at = datetime('now') WHERE id = ?")
      .run(title, content, deadline || null, id);
    return db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  },

  updateStatus(id, status) {
    const db = getDb();
    db.prepare("UPDATE topics SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, id);
    return db.prepare('SELECT * FROM topics WHERE id = ?').get(id);
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM topics WHERE id = ?').run(id);
  }
};

module.exports = Topic;
