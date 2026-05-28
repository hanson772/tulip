const Tag = require('../models/Tag');

const getTags = (req, res) => {
  try {
    const tags = Tag.findAll();
    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching tags' });
  }
};

const createTag = (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }
    if (name.length > 20) {
      return res.status(400).json({ message: 'Tag name too long (max 20 characters)' });
    }
    const existing = Tag.findAll().find(t => t.name === name);
    if (existing) {
      return res.status(409).json({ message: 'Tag already exists' });
    }
    const tag = Tag.create(name);
    res.status(201).json(tag);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating tag' });
  }
};

const updateTag = (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = Tag.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ message: 'Tag name is required' });
    }
    if (name.length > 20) {
      return res.status(400).json({ message: 'Tag name too long (max 20 characters)' });
    }
    const duplicate = Tag.findAll().find(t => t.name === name && t.id !== id);
    if (duplicate) {
      return res.status(409).json({ message: 'Tag name already exists' });
    }
    const tag = Tag.update(id, name);
    res.json(tag);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating tag' });
  }
};

const deleteTag = (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = Tag.findById(id);
    if (!existing) {
      return res.status(404).json({ message: 'Tag not found' });
    }
    Tag.delete(id);
    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting tag' });
  }
};

module.exports = { getTags, createTag, updateTag, deleteTag };
