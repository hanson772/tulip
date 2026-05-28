const express = require('express');
const router = express.Router();
const { getTags, createTag, updateTag, deleteTag } = require('../controllers/tagController');
const { auth } = require('../middleware/auth');

router.route('/')
  .get(getTags)
  .post(auth, createTag);

router.route('/:id')
  .put(auth, updateTag)
  .delete(auth, deleteTag);

module.exports = router;
