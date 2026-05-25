const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'joinedClubs',
      'name department category description coverImage'
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update profile (name, department, interests, bio, avatar)
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, interests, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (department !== undefined) user.department = department;
    if (interests !== undefined) user.interests = interests;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        departmentId: user.departmentId,
        interests: user.interests,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Delete old avatar file if it exists
    if (user.avatar) {
      const relativePath = user.avatar.startsWith('http')
        ? new URL(user.avatar).pathname
        : user.avatar;
      const oldPath = path.join(__dirname, '..', relativePath);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const base = `${req.protocol}://${req.get('host')}`;
    user.avatar = `${base}/uploads/avatars/${req.file.filename}`;
    await user.save();

    res.json({
      success: true,
      avatar: user.avatar,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        interests: user.interests,
        bio: user.bio,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's joined clubs
// @route   GET /api/users/my-clubs
// @access  Private
exports.getMyClubs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'joinedClubs',
      populate: { path: 'admin', select: 'name email' },
    });
    res.json({ success: true, clubs: user.joinedClubs });
  } catch (error) {
    next(error);
  }
};
