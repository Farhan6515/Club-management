const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getConversations, getOrCreate } = require('../controllers/dmController');

router.get('/',        protect, getConversations);
router.get('/:userId', protect, getOrCreate);

module.exports = router;
