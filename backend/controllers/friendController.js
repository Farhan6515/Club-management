const User = require('../models/User');

// GET /api/friends/requests  — incoming pending requests
exports.getRequests = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friendRequests.from', 'name department avatar');
    res.json({ success: true, requests: user.friendRequests });
  } catch (e) { next(e); }
};

// GET /api/friends  — my friends list
exports.getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name department avatar bio');
    res.json({ success: true, friends: user.friends });
  } catch (e) { next(e); }
};

// GET /api/friends/users/:id  — public profile of any user
exports.getPublicProfile = async (req, res, next) => {
  try {
    const target = await User.findById(req.params.id)
      .select('name department bio interests avatar joinedClubs friends friendRequests sentRequests createdAt')
      .populate('joinedClubs', 'name category department');
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    const me = await User.findById(req.user._id).select('friends sentRequests friendRequests');

    const isFriend      = me.friends.some(f => f.toString() === target._id.toString());
    const requestSent   = me.sentRequests.some(s => s.toString() === target._id.toString());
    const requestRecvd  = me.friendRequests.some(r => r.from.toString() === target._id.toString());

    res.json({
      success: true,
      user: {
        _id: target._id,
        name: target.name,
        department: target.department,
        bio: target.bio,
        interests: target.interests,
        avatar: target.avatar,
        joinedClubs: target.joinedClubs,
        createdAt: target.createdAt,
        friendCount: target.friends.length,
      },
      relation: { isFriend, requestSent, requestRecvd },
    });
  } catch (e) { next(e); }
};

// POST /api/friends/request/:userId  — send friend request
exports.sendRequest = async (req, res, next) => {
  try {
    const targetId = req.params.userId;
    if (targetId === req.user._id.toString())
      return res.status(400).json({ success: false, message: "Can't add yourself" });

    const [me, target] = await Promise.all([
      User.findById(req.user._id),
      User.findById(targetId),
    ]);
    if (!target) return res.status(404).json({ success: false, message: 'User not found' });

    if (me.friends.includes(targetId))
      return res.status(400).json({ success: false, message: 'Already friends' });
    if (me.sentRequests.some(s => s.toString() === targetId))
      return res.status(400).json({ success: false, message: 'Request already sent' });

    me.sentRequests.push(targetId);
    target.friendRequests.push({ from: req.user._id });
    await Promise.all([me.save(), target.save()]);

    res.json({ success: true, message: 'Friend request sent' });
  } catch (e) { next(e); }
};

// POST /api/friends/accept/:userId  — accept a request from userId
exports.acceptRequest = async (req, res, next) => {
  try {
    const fromId = req.params.userId;
    const [me, sender] = await Promise.all([
      User.findById(req.user._id),
      User.findById(fromId),
    ]);
    if (!sender) return res.status(404).json({ success: false, message: 'User not found' });

    const reqIndex = me.friendRequests.findIndex(r => r.from.toString() === fromId);
    if (reqIndex === -1)
      return res.status(400).json({ success: false, message: 'No request from this user' });

    me.friendRequests.splice(reqIndex, 1);
    me.friends.push(fromId);
    sender.sentRequests = sender.sentRequests.filter(s => s.toString() !== req.user._id.toString());
    sender.friends.push(req.user._id);

    await Promise.all([me.save(), sender.save()]);
    res.json({ success: true, message: 'Friend request accepted' });
  } catch (e) { next(e); }
};

// POST /api/friends/reject/:userId  — reject a request from userId
exports.rejectRequest = async (req, res, next) => {
  try {
    const fromId = req.params.userId;
    const [me, sender] = await Promise.all([
      User.findById(req.user._id),
      User.findById(fromId),
    ]);

    me.friendRequests = me.friendRequests.filter(r => r.from.toString() !== fromId);
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(s => s.toString() !== req.user._id.toString());
      await sender.save();
    }
    await me.save();
    res.json({ success: true, message: 'Request rejected' });
  } catch (e) { next(e); }
};

// DELETE /api/friends/:userId  — remove friend
exports.removeFriend = async (req, res, next) => {
  try {
    const otherId = req.params.userId;
    await Promise.all([
      User.findByIdAndUpdate(req.user._id, { $pull: { friends: otherId } }),
      User.findByIdAndUpdate(otherId, { $pull: { friends: req.user._id } }),
    ]);
    res.json({ success: true, message: 'Friend removed' });
  } catch (e) { next(e); }
};
