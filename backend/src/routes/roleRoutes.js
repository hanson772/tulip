const express = require('express');
const { getRoles, getMyRoles, createRole, deleteRole, assignUserRoles } = require('../controllers/roleController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.route('/')
  .get(getRoles)
  .post(auth, createRole);

router.route('/mine')
  .get(auth, getMyRoles);

router.route('/user/:userId')
  .put(auth, assignUserRoles);

router.route('/:id')
  .delete(auth, deleteRole);

module.exports = router;
