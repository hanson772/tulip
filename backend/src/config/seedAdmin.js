const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const log = require('./logger');

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    return;
  }

  const existing = User.findOne('email', email);
  if (existing) {
    const adminRole = Role.findByName('admin');
    if (adminRole) {
      const roles = Role.getRoleNames(existing.id);
      if (!roles.includes('admin')) {
        Role.setUserRoles(existing.id, [...roles.map(r => Role.findByName(r).id), adminRole.id]);
        log.info(`Admin role assigned to existing user: ${email}`);
      }
    }
    return;
  }

  const salt = bcrypt.genSaltSync(10);
  const hashed = bcrypt.hashSync(password, salt);

  const user = User.create({ name, email, password: hashed });

  const adminRole = Role.findByName('admin');
  const userRole = Role.findByName('user');
  const roleIds = [userRole.id];
  if (adminRole) roleIds.push(adminRole.id);
  Role.setUserRoles(user.id, roleIds);

  log.info(`Admin user created: ${email}`);
}

module.exports = seedAdmin;
