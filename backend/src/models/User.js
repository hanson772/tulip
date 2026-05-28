const { getDb } = require('../config/database');

const User = {
  findOne(field, value) {
    const db = getDb();
    const allowedFields = ['id', 'email'];
    if (!allowedFields.includes(field)) return null;
    const stmt = db.prepare(`SELECT * FROM users WHERE ${field} = ?`);
    return stmt.get(value);
  },

  create({ name, email, password, nickname, level, avatar }) {
    const db = getDb();
    const stmt = db.prepare(
      'INSERT INTO users (name, email, password, nickname, level, avatar) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(name, email, password, nickname || name, level || 1, avatar || null);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(db.prepare('SELECT last_insert_rowid() as id').get().id));
  },

  updateAvatar(userId, avatar) {
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET avatar = ?, updated_at = datetime(\'now\') WHERE id = ?');
    stmt.run(avatar, userId);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },

  updateProfile(userId, { nickname }) {
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET nickname = ?, updated_at = datetime(\'now\') WHERE id = ?');
    stmt.run(nickname, userId);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }
};

module.exports = User;
