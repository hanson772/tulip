const { getDb } = require('../config/database');

const User = {
  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

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

  findAll(search) {
    const db = getDb();
    if (search) {
      const like = `%${search}%`;
      return db.prepare(
        "SELECT id, name, email, nickname, avatar, level, disabled, muted, created_at, updated_at FROM users WHERE name LIKE ? OR email LIKE ? OR nickname LIKE ? ORDER BY created_at DESC"
      ).all(like, like, like);
    }
    return db.prepare(
      "SELECT id, name, email, nickname, avatar, level, disabled, muted, created_at, updated_at FROM users ORDER BY created_at DESC"
    ).all();
  },

  updateProfile(userId, { nickname }) {
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET nickname = ?, updated_at = datetime(\'now\') WHERE id = ?');
    stmt.run(nickname, userId);
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  },

  setDisabled(userId, disabled) {
    const db = getDb();
    db.prepare("UPDATE users SET disabled = ?, updated_at = datetime('now') WHERE id = ?").run(disabled ? 1 : 0, userId);
    return db.prepare('SELECT id, name, email, nickname, disabled FROM users WHERE id = ?').get(userId);
  },

  setMuted(userId, muted) {
    const db = getDb();
    db.prepare("UPDATE users SET muted = ?, updated_at = datetime('now') WHERE id = ?").run(muted ? 1 : 0, userId);
    return db.prepare('SELECT id, name, email, nickname, muted FROM users WHERE id = ?').get(userId);
  },

  resetPassword(userId, hashedPassword) {
    const db = getDb();
    db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashedPassword, userId);
  }
};

module.exports = User;
