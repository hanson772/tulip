const express = require('express');
const router = express.Router();
const { getPosts, createPost, updatePost, deletePost } = require('../controllers/postController');
const { auth } = require('../middleware/auth');

router.route('/')
  .get(auth, getPosts)
  .post(auth, createPost);

router.route('/:id')
  .put(auth, updatePost)
  .delete(auth, deletePost);

module.exports = router;
