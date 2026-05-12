const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar, getMyClubs } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/avatars')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);
router.post('/avatar',  protect, upload.single('avatar'), uploadAvatar);
router.get('/my-clubs', protect, getMyClubs);

module.exports = router;
