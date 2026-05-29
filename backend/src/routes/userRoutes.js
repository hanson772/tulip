const express = require('express');
const { registerUser, loginUser, uploadAvatar, updateProfile, getAllUsers, disableUser, enableUser, muteUser, unmuteUser, adminResetPassword } = require('../controllers/userController');
const { auth, adminAuth } = require('../middleware/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/avatar', auth, uploadAvatar);
router.put('/profile', auth, updateProfile);
router.get('/all', auth, getAllUsers);
router.post('/:id/disable', adminAuth, disableUser);
router.post('/:id/enable', adminAuth, enableUser);
router.post('/:id/mute', adminAuth, muteUser);
router.post('/:id/unmute', adminAuth, unmuteUser);
router.post('/:id/reset-password', adminAuth, adminResetPassword);

module.exports = router;