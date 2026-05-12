const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getMyStats,
  dailyLogin,
  getLeaderboard,
  getAdminAnalytics,
  getUserPublicStats,
} = require('../controllers/gamificationController');

router.get('/my-stats',           protect, getMyStats);
router.post('/daily-login',       protect, dailyLogin);
router.get('/leaderboard',        protect, getLeaderboard);
router.get('/admin/analytics',    protect, adminOnly, getAdminAnalytics);
router.get('/users/:userId/stats', protect, getUserPublicStats);

module.exports = router;
