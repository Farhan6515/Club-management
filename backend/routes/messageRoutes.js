const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Club = require('../models/Club');
const { protect } = require('../middleware/authMiddleware');

// GET /api/messages/:clubId  — last 50 messages, members only
router.get('/:clubId', protect, async (req, res, next) => {
  try {
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ success: false, message: 'Club not found' });

    const isMember = club.members.some((m) => m.toString() === req.user._id.toString());
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Members only' });
    }

    const messages = await Message.find({ club: req.params.clubId })
      .populate('author', 'name')
      .sort({ createdAt: 1 })
      .limit(50);

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
