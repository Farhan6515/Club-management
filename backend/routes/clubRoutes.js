const express = require('express');
const router = express.Router();
const {
  getClubs,
  getRecommendedClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  joinClub,
  leaveClub,
  removeMember,
  getMyAdminClubs,
  assignPosition,
  removePosition,
  uploadCover,
  uploadCoverImage,
} = require('../controllers/clubController');
const {
  protect,
  adminOnly,
  requireDeptId,
} = require('../middleware/authMiddleware');

// Specific routes BEFORE /:id to avoid conflicts
router.get('/recommended', protect, getRecommendedClubs);
router.get('/admin/my-clubs', protect, adminOnly, getMyAdminClubs);

router.route('/').get(protect, getClubs).post(protect, adminOnly, requireDeptId, createClub);

router
  .route('/:id')
  .get(protect, getClubById)
  .put(protect, adminOnly, requireDeptId, updateClub)
  .delete(protect, adminOnly, requireDeptId, deleteClub);

router.post('/:id/join', protect, joinClub);
router.post('/:id/leave', protect, leaveClub);
router.delete('/:id/members/:userId', protect, adminOnly, removeMember);
router.put('/:id/positions/:userId',    protect, assignPosition);
router.delete('/:id/positions/:userId', protect, removePosition);
router.post('/:id/cover', protect, uploadCover.single('cover'), uploadCoverImage);

module.exports = router;
