const express = require('express');
const router = express.Router();
const {
  createActivity,
  getClubActivities,
  getFeed,
  deleteActivity,
  toggleLike,
  addComment,
  deleteComment,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.get('/feed', protect, getFeed);
router.get('/club/:clubId', protect, getClubActivities);
router.post('/club/:clubId', protect, createActivity);
router.delete('/:id', protect, deleteActivity);
router.post('/:id/like', protect, toggleLike);
router.post('/:id/comments', protect, addComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

module.exports = router;
