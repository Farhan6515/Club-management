const Conversation = require('../models/Conversation');
const User = require('../models/User');

const dmRoomId = (a, b) => [a.toString(), b.toString()].sort().join('-');

// GET /api/dm  — all conversations for current user
exports.getConversations = async (req, res, next) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatar department')
      .sort({ updatedAt: -1 });

    const result = convs.map(c => {
      const other = c.participants.find(p => p._id.toString() !== req.user._id.toString());
      const last  = c.messages[c.messages.length - 1];
      const unread = c.messages.filter(m => !m.read && m.sender.toString() !== req.user._id.toString()).length;
      return { _id: c._id, other, lastMessage: last || null, unread, updatedAt: c.updatedAt };
    });

    res.json({ success: true, conversations: result });
  } catch (e) { next(e); }
};

// GET /api/dm/:userId  — get or create conversation + messages
exports.getOrCreate = async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    const me = await User.findById(req.user._id).select('friends');
    const isFriend = me.friends.some(f => f.toString() === otherId);
    if (!isFriend) return res.status(403).json({ success: false, message: 'You must be friends to chat' });

    let conv = await Conversation.findOne({ participants: { $all: [req.user._id, otherId], $size: 2 } })
      .populate('messages.sender', 'name');

    if (!conv) {
      conv = await Conversation.create({ participants: [req.user._id, otherId], messages: [] });
      conv = await Conversation.findById(conv._id).populate('messages.sender', 'name');
    }

    // Mark received messages as read
    conv.messages.forEach(m => { if (m.sender._id?.toString() !== req.user._id.toString()) m.read = true; });
    await conv.save();

    res.json({ success: true, conversationId: conv._id, messages: conv.messages });
  } catch (e) { next(e); }
};
