const Post = require('../models/Post');

const getPosts = (req, res) => {
  try {
    const posts = Post.findByUserId(req.userId);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching posts' });
  }
};

const createPost = (req, res) => {
  try {
    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Content too long (max 1000 characters)' });
    }

    const post = Post.create({ userId: req.userId, content });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating post' });
  }
};

const updatePost = (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (content.length > 1000) {
      return res.status(400).json({ message: 'Content too long (max 1000 characters)' });
    }

    const updated = Post.update(id, { content });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating post' });
  }
};

const deletePost = (req, res) => {
  try {
    const id = Number(req.params.id);
    const post = Post.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    if (post.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Post.delete(id);
    res.json({ message: 'Post removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting post' });
  }
};

module.exports = { getPosts, createPost, updatePost, deletePost };
