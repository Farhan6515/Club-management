const express = require('express');
const multer = require('multer');
const router = express.Router();
const { getProfile, updateProfile, uploadAvatar, getMyClubs } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { avatarStorage } = require('../config/cloudinary');

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    file.mimetype.startsWith('image/') ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
});

router.get('/profile',  protect, getProfile);
router.put('/profile',  protect, updateProfile);
router.post('/avatar',  protect, upload.single('avatar'), uploadAvatar);
router.get('/my-clubs', protect, getMyClubs);

module.exports = router;
