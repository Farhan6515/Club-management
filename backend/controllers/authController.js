const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { checkDailyLogin } = require('../services/gamificationService');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Helper: check if a department ID is in the configured valid list
const isValidDeptId = (deptId) => {
  if (!deptId) return false;
  const validIds = (process.env.VALID_DEPT_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
  return validIds.includes(deptId);
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res, next) => {
  try {
    const { name, email, password, department, departmentId, interests } =
      req.body;

    if (!name || !email || !password || !department) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password and department',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: 'Email already registered' });
    }

    // Optional: if user provides a valid Department ID at signup, make them admin
    let role = 'user';
    let validatedDeptId = null;
    if (departmentId) {
      if (!isValidDeptId(departmentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Department ID',
        });
      }
      role = 'admin';
      validatedDeptId = departmentId;
    }

    const user = await User.create({
      name,
      email,
      password,
      department,
      role,
      departmentId: validatedDeptId,
      interests: interests || [],
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        departmentId: user.departmentId,
        interests: user.interests,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password'
    );
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    const loginReward = await checkDailyLogin(user._id).catch(() => null);

    res.json({
      success: true,
      token,
      loginReward,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        department: user.department,
        role: user.role,
        departmentId: user.departmentId,
        interests: user.interests,
        bio: user.bio,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate(
      'joinedClubs',
      'name department category'
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Sign in / sign up via Google OAuth
// @route   POST /api/auth/google
// @access  Public
exports.googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'No credential provided' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // New Google user — create account with random password (Google users never use it)
      const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
      user = await User.create({
        name,
        email: email.toLowerCase(),
        password: randomPassword,
        department: 'OTHER',
        role: 'user',
        avatar: picture || '',
        interests: [],
      });
    }

    const token = generateToken(user._id);
    const loginReward = await checkDailyLogin(user._id).catch(() => null);

    res.json({
      success: true,
      token,
      loginReward,
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

// @desc    Upgrade to admin by providing a valid Department ID
// @route   POST /api/auth/verify-dept
// @access  Private
exports.verifyDeptId = async (req, res, next) => {
  try {
    const { departmentId } = req.body;
    if (!isValidDeptId(departmentId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid Department ID' });
    }

    const user = await User.findById(req.user._id);
    user.role = 'admin';
    user.departmentId = departmentId;
    await user.save();

    res.json({
      success: true,
      message: 'Admin access granted',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    next(error);
  }
};
