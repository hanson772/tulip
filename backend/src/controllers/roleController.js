const Role = require('../models/Role');

const getRoles = (req, res) => {
  try {
    const roles = Role.findAll();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching roles' });
  }
};

const getMyRoles = (req, res) => {
  try {
    const roles = Role.getUserRoles(req.userId);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your roles' });
  }
};

const createRole = (req, res) => {
  try {
    const name = (req.body.name || '').trim().toLowerCase();
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const existing = Role.findByName(name);
    if (existing) {
      return res.status(400).json({ message: 'Role already exists' });
    }
    const role = Role.create({ name, description: req.body.description });
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating role' });
  }
};

const deleteRole = (req, res) => {
  try {
    const id = Number(req.params.id);
    const role = Role.findById(id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    Role.delete(id);
    res.json({ message: 'Role deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting role' });
  }
};

const assignUserRoles = (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { roleIds } = req.body;
    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ message: 'roleIds array is required' });
    }
    Role.setUserRoles(userId, roleIds);
    const roles = Role.getRoleNames(userId);
    res.json({ userId, roles });
  } catch (error) {
    res.status(500).json({ message: 'Server error assigning roles' });
  }
};

module.exports = {
  getRoles,
  getMyRoles,
  createRole,
  deleteRole,
  assignUserRoles
};
