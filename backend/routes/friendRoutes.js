const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getRequests, getFriends, getPublicProfile,
  sendRequest, acceptRequest, rejectRequest, removeFriend,
} = require('../controllers/friendController');

router.get('/requests',        protect, getRequests);
router.get('/',                protect, getFriends);
router.get('/users/:id',       protect, getPublicProfile);
router.post('/request/:userId',protect, sendRequest);
router.post('/accept/:userId', protect, acceptRequest);
router.post('/reject/:userId', protect, rejectRequest);
router.delete('/:userId',      protect, removeFriend);

module.exports = router;
