const Topic = require('../models/Topic');
const Opinion = require('../models/Opinion');
const Tag = require('../models/Tag');
const Comment = require('../models/Comment');
const Role = require('../models/Role');

const getTopics = (req, res) => {
  try {
    const { tag } = req.query;
    const topics = tag ? Topic.findByTag(tag) : Topic.findAll();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching topics' });
  }
};

const getMyTopics = (req, res) => {
  try {
    const topics = Topic.findAllByUser(req.userId);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching your topics' });
  }
};

const getMyDrafts = (req, res) => {
  try {
    const topics = Topic.findByStatus(req.userId, ['draft', 'reviewing']);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching drafts' });
  }
};

const getMyPublished = (req, res) => {
  try {
    const topics = Topic.findByStatus(req.userId, ['published', 'expired']);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching published topics' });
  }
};

const getMyFavorites = (req, res) => {
  try {
    const topics = Topic.findFavoritesByUser(req.userId);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching favorites' });
  }
};

const getMyParticipated = (req, res) => {
  try {
    const topics = Topic.findParticipatedByUser(req.userId);
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching participated topics' });
  }
};

const getReviewTopics = (req, res) => {
  try {
    const topics = Topic.findReviewTopics();
    res.json(topics);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching review topics' });
  }
};

const getTopic = (req, res) => {
  try {
    const id = Number(req.params.id);
    const topic = Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    // Non-owners can only view published or expired topics (unless admin)
    if (topic.status !== 'published' && topic.status !== 'expired' && topic.user_id !== req.userId) {
      const isAdmin = req.userId && Role.getRoleNames(req.userId).includes('admin');
      if (!isAdmin) {
        return res.status(404).json({ message: 'Topic not found' });
      }
    }
    // Include which opinion the current user has supported
    if (req.userId) {
      const support = Opinion.findUserSupport(id, req.userId);
      topic.user_supported_opinion_id = support ? support.opinion_id : null;
    }
    res.json(topic);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching topic' });
  }
};

const createTopic = (req, res) => {
  try {
    const title = (req.body.title || '').trim();
    const content = (req.body.content || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }
    if (title.length > 200) {
      return res.status(400).json({ message: 'Title too long (max 200 characters)' });
    }
    if (content.length > 5000) {
      return res.status(400).json({ message: 'Content too long (max 5000 characters)' });
    }

    const deadline = req.body.deadline || null;
    const tags = req.body.tags;

    const topic = Topic.create({ userId: req.userId, title, content, deadline });
    if (tags && Array.isArray(tags)) {
      Tag.setTopicTags(topic.id, tags);
    }
    res.status(201).json(Topic.findById(topic.id));
  } catch (error) {
    res.status(500).json({ message: 'Server error creating topic' });
  }
};

const updateTopic = (req, res) => {
  try {
    const id = Number(req.params.id);
    const topic = Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (topic.status !== 'draft') {
      return res.status(400).json({ message: 'Can only edit topics in draft status' });
    }

    const title = (req.body.title || '').trim();
    const content = (req.body.content || '').trim();
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const deadline = req.body.deadline !== undefined ? req.body.deadline : null;
    const tags = req.body.tags;

    const updated = Topic.update(id, { title, content, deadline });
    if (tags !== undefined && Array.isArray(tags)) {
      Tag.setTopicTags(id, tags);
    }
    res.json(Topic.findById(id));
  } catch (error) {
    res.status(500).json({ message: 'Server error updating topic' });
  }
};

const deleteTopic = (req, res) => {
  try {
    const id = Number(req.params.id);
    const topic = Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    Topic.delete(id);
    res.json({ message: 'Topic removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting topic' });
  }
};

const publishTopic = (req, res) => {
  try {
    const id = Number(req.params.id);
    const topic = Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (topic.status !== 'draft') {
      return res.status(400).json({ message: 'Topic is not in draft status' });
    }

    const opinions = Opinion.findByTopicId(id);
    if (!opinions || opinions.length === 0) {
      return res.status(400).json({ message: 'At least one opinion is required before publishing' });
    }

    const updated = Topic.updateStatus(id, 'reviewing');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error publishing topic' });
  }
};

const reviewTopic = (req, res) => {
  try {
    const id = Number(req.params.id);
    const topic = Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.status !== 'reviewing') {
      return res.status(400).json({ message: 'Topic is not in reviewing status' });
    }

    const roles = Role.getRoleNames(req.userId);
    if (!roles.includes('admin')) {
      return res.status(403).json({ message: 'Only admins can review topics' });
    }

    const updated = Topic.updateStatus(id, 'published');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error reviewing topic' });
  }
};

const createOpinion = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const topic = Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Only topic owner can manage opinions' });
    }
    if (topic.status !== 'draft') {
      return res.status(400).json({ message: 'Can only manage opinions in draft status' });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Opinion content is required' });
    }
    if (content.length > 200) {
      return res.status(400).json({ message: 'Opinion too long (max 200 characters)' });
    }

    const visible = req.body.visible !== undefined ? req.body.visible : true;
    const selectable = req.body.selectable !== undefined ? req.body.selectable : true;

    const opinion = Opinion.create({ topicId, userId: req.userId, content, visible, selectable });
    res.status(201).json(opinion);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating opinion' });
  }
};

const updateOpinion = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const opinionId = Number(req.params.opinionId);
    const topic = Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Only topic owner can manage opinions' });
    }
    if (topic.status !== 'draft') {
      return res.status(400).json({ message: 'Can only manage opinions in draft status' });
    }

    const opinion = Opinion.findById(opinionId);
    if (!opinion || opinion.topic_id !== topicId) {
      return res.status(404).json({ message: 'Opinion not found' });
    }

    const content = req.body.content !== undefined ? (req.body.content || '').trim() : undefined;
    if (content !== undefined) {
      if (!content) {
        return res.status(400).json({ message: 'Opinion content is required' });
      }
      if (content.length > 200) {
        return res.status(400).json({ message: 'Opinion too long (max 200 characters)' });
      }
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (req.body.visible !== undefined) updateData.visible = req.body.visible;
    if (req.body.selectable !== undefined) updateData.selectable = req.body.selectable;

    const updated = Opinion.update(opinionId, updateData);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating opinion' });
  }
};

const deleteOpinion = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const opinionId = Number(req.params.opinionId);
    const topic = Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.user_id !== req.userId) {
      return res.status(403).json({ message: 'Only topic owner can manage opinions' });
    }
    if (topic.status !== 'draft') {
      return res.status(400).json({ message: 'Can only manage opinions in draft status' });
    }

    const opinion = Opinion.findById(opinionId);
    if (!opinion || opinion.topic_id !== topicId) {
      return res.status(404).json({ message: 'Opinion not found' });
    }

    Opinion.delete(opinionId);
    res.json({ message: 'Opinion removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting opinion' });
  }
};

const supportOpinion = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const opinionId = Number(req.params.opinionId);
    const userId = req.userId;

    const topic = Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }
    if (topic.status === 'expired') {
      return res.status(400).json({ message: 'Cannot support opinions on expired topics' });
    }

    const opinion = Opinion.findById(opinionId);
    if (!opinion || opinion.topic_id !== topicId) {
      return res.status(404).json({ message: 'Opinion not found' });
    }

    const existingSupport = Opinion.findUserSupport(topicId, userId);

    if (existingSupport) {
      if (existingSupport.opinion_id === opinionId) {
        // Tapping the already-supported opinion -> unsupport
        Opinion.deleteSupport(topicId, userId);
        Opinion.support(opinionId, false);
      } else {
        // Switching to a different opinion
        Opinion.deleteSupport(topicId, userId);
        Opinion.support(existingSupport.opinion_id, false);
        Opinion.createSupport(topicId, userId, opinionId);
        Opinion.support(opinionId, true);
      }
    } else {
      // New support
      Opinion.createSupport(topicId, userId, opinionId);
      Opinion.support(opinionId, true);
    }

    const updated = Opinion.findById(opinionId);
    const newSupport = Opinion.findUserSupport(topicId, userId);
    res.json({ opinion: updated, user_supported_opinion_id: newSupport ? newSupport.opinion_id : null });
  } catch (error) {
    res.status(500).json({ message: 'Server error supporting opinion' });
  }
};

const getComments = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const comments = Comment.findByTopicId(topicId);
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching comments' });
  }
};

const createComment = (req, res) => {
  try {
    const topicId = Number(req.params.id);
    const topic = Topic.findById(topicId);
    if (!topic) {
      return res.status(404).json({ message: 'Topic not found' });
    }

    const content = (req.body.content || '').trim();
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    if (content.length > 500) {
      return res.status(400).json({ message: 'Comment too long (max 500 characters)' });
    }

    let parentId = req.body.parentId ? Number(req.body.parentId) : null;
    let replyToUserId = null;

    // If replying to a comment, validate parent exists and belongs to same topic
    if (parentId) {
      const parentComment = Comment.findById(parentId);
      if (!parentComment || parentComment.topic_id !== topicId) {
        return res.status(400).json({ message: 'Parent comment not found' });
      }
      // Enforce one-level nesting: cannot reply to a reply
      if (parentComment.parent_id !== null) {
        return res.status(400).json({ message: 'Cannot reply to a reply' });
      }
      replyToUserId = parentComment.user_id;
    }

    const comment = Comment.create({ topicId, userId: req.userId, content, parentId, replyToUserId });
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating comment' });
  }
};

module.exports = {
  getTopics, getMyTopics, getMyDrafts, getMyPublished, getMyFavorites, getMyParticipated, getReviewTopics, getTopic, createTopic, updateTopic, deleteTopic, publishTopic, reviewTopic,
  createOpinion, updateOpinion, deleteOpinion, supportOpinion,
  getComments, createComment
};
