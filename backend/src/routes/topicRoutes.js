const express = require('express');
const router = express.Router();
const {
  getTopics, getMyTopics, getMyDrafts, getMyPublished, getMyFavorites, getMyParticipated, getReviewTopics, getTopic, createTopic, updateTopic, deleteTopic, publishTopic, reviewTopic,
  createOpinion, updateOpinion, deleteOpinion, supportOpinion,
  getComments, createComment
} = require('../controllers/topicController');
const { auth, optionalAuth } = require('../middleware/auth');

// User's own topics (must be before /:id)
router.route('/mine')
  .get(auth, getMyTopics);

router.route('/mine/drafts')
  .get(auth, getMyDrafts);

router.route('/mine/published')
  .get(auth, getMyPublished);

router.route('/mine/favorites')
  .get(auth, getMyFavorites);

router.route('/mine/participated')
  .get(auth, getMyParticipated);

router.route('/review')
  .get(auth, getReviewTopics);

// Topics
router.route('/')
  .get(getTopics)
  .post(auth, createTopic);

router.route('/:id')
  .get(optionalAuth, getTopic)
  .put(auth, updateTopic)
  .delete(auth, deleteTopic);

// Publish
router.route('/:id/publish')
  .post(auth, publishTopic);

// Review (admin)
router.route('/:id/review')
  .post(auth, reviewTopic);

// Opinions on a topic
router.route('/:id/opinions')
  .post(auth, createOpinion);

router.route('/:id/opinions/:opinionId')
  .put(auth, updateOpinion)
  .delete(auth, deleteOpinion);

router.route('/:id/opinions/:opinionId/support')
  .post(auth, supportOpinion);

// Comments on a topic
router.route('/:id/comments')
  .get(getComments)
  .post(auth, createComment);

module.exports = router;
