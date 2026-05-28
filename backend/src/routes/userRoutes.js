const express = require('express');
const { registerUser, loginUser, uploadAvatar, updateProfile } = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/avatar', auth, uploadAvatar);
router.put('/profile', auth, updateProfile);

module.exports = router;