const User = require('../models/User');
const Role = require('../models/Role');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AVATAR_COLORS = ['#409EFF', '#67C23A', '#E6A23C', '#F56C6C', '#909399', '#9B59B6', '#1ABC9C', '#E67E22', '#2ECC71', '#3498DB'];

function generateInitialAvatar(name) {
  const initial = (name || '?')[0].toUpperCase();
  const bgColor = AVATAR_COLORS[(name || '').length % AVATAR_COLORS.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="50" fill="${bgColor}"/>
    <text x="50" y="50" text-anchor="middle" dominant-baseline="central" fill="white" font-size="40" font-family="Arial,Helvetica,sans-serif" font-weight="bold">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

// @desc    Register user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = User.findOne('email', email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate default avatar with initial letter
    const avatar = generateInitialAvatar(name);

    // Create user with defaults
    const user = User.create({
      name,
      email,
      password: hashedPassword,
      nickname: name,
      level: 1,
      avatar
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    // Assign default 'user' role
    const userRole = Role.findByName('user');
    if (userRole) Role.setUserRoles(user.id, [userRole.id]);

    const roles = Role.getRoleNames(user.id);

    res.status(201).json({
      _id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      level: user.level,
      roles,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = User.findOne('email', email);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    const roles = Role.getRoleNames(user.id);

    res.json({
      _id: user.id,
      name: user.name,
      nickname: user.nickname || user.name,
      email: user.email,
      avatar: user.avatar || null,
      level: user.level || 1,
      roles,
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Upload avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: 'Avatar data is required' });
    }

    // Validate size: base64 string of a 500KB image is roughly 500K chars
    if (avatar.length > 700000) {
      return res.status(400).json({ message: 'Avatar too large, max 500KB' });
    }

    const user = User.updateAvatar(req.userId, avatar);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ avatar: user.avatar });
  } catch (error) {
    res.status(500).json({ message: 'Server error during avatar upload' });
  }
};

// @desc    Update user profile (nickname)
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { nickname } = req.body;

    if (!nickname || !nickname.trim()) {
      return res.status(400).json({ message: 'Nickname is required' });
    }

    const user = User.updateProfile(req.userId, { nickname: nickname.trim() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      nickname: user.nickname,
      email: user.email,
      avatar: user.avatar,
      level: user.level
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

// @desc    Get all users (with optional search)
// @route   GET /api/users/all
// @access  Private (admin)
const getAllUsers = (req, res) => {
  try {
    const search = req.query.search || '';
    const users = User.findAll(search);
    // Attach roles to each user
    const result = users.map(u => ({
      ...u,
      roles: Role.getRoleNames(u.id)
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Disable user
// @route   POST /api/users/:id/disable
// @access  Admin
const disableUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.setDisabled(userId, true);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User disabled', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error disabling user' });
  }
};

// @desc    Enable user
// @route   POST /api/users/:id/enable
// @access  Admin
const enableUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.setDisabled(userId, false);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User enabled', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error enabling user' });
  }
};

// @desc    Mute user
// @route   POST /api/users/:id/mute
// @access  Admin
const muteUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.setMuted(userId, true);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User muted', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error muting user' });
  }
};

// @desc    Unmute user
// @route   POST /api/users/:id/unmute
// @access  Admin
const unmuteUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const user = User.setMuted(userId, false);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User unmuted', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error unmuting user' });
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Admin
const adminResetPassword = async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    User.resetPassword(userId, hashedPassword);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error resetting password' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  uploadAvatar,
  updateProfile,
  getAllUsers,
  disableUser,
  enableUser,
  muteUser,
  unmuteUser,
  adminResetPassword
};
