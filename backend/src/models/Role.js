const { getDb } = require('../config/database');

const Role = {
  findAll() {
    const db = getDb();
    return db.prepare('SELECT * FROM roles ORDER BY name').all() || [];
  },

  findByName(name) {
    const db = getDb();
    return db.prepare('SELECT * FROM roles WHERE name = ?').get(name);
  },

  findById(id) {
    const db = getDb();
    return db.prepare('SELECT * FROM roles WHERE id = ?').get(id);
  },

  create({ name, description }) {
    const db = getDb();
    db.prepare('INSERT INTO roles (name, description) VALUES (?, ?)').run(name, description || null);
    return db.prepare('SELECT * FROM roles WHERE id = ?').get(Number(db.prepare('SELECT last_insert_rowid() as id').get().id));
  },

  delete(id) {
    const db = getDb();
    return db.prepare('DELETE FROM roles WHERE id = ?').run(id);
  },

  getUserRoles(userId) {
    const db = getDb();
    const rows = db.prepare(`
      SELECT r.id, r.name, r.description
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
      ORDER BY r.name
    `).all(userId) || [];
    return rows;
  },

  getRoleNames(userId) {
    const roles = this.getUserRoles(userId);
    return roles.map(r => r.name);
  },

  setUserRoles(userId, roleIds) {
    const db = getDb();
    db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(userId);
    const insert = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
    for (const roleId of roleIds) {
      insert.run(userId, roleId);
    }
  }
};

module.exports = Role;
