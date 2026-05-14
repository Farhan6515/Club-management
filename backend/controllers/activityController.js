const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Activity = require('../models/Activity');
const Club = require('../models/Club');
const User = require('../models/User');
const { awardPoints } = require('../services/gamificationService');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/posts');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user._id}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /\.(jpg|jpeg|png|gif|webp|mp4|webm|mov)$/i;
  allowed.test(path.extname(file.originalname)) ? cb(null, true) : cb(new Error('Only images and videos are allowed'));
};

exports.upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// @desc    Create a new activity for a club (post/event/announcement)
// @route   POST /api/activities/club/:clubId
// @access  Private/Admin
exports.createActivity = async (req, res, next) => {
  try {
    const { type, title, content, eventDate, eventLocation, image } = req.body;
    const base = `${req.protocol}://${req.get('host')}`;
    const media = (req.files || []).map(f => ({
      url: `${base}/uploads/posts/${f.filename}`,
      type: f.mimetype.startsWith('video/') ? 'video' : 'image',
    }));
    const club = await Club.findById(req.params.clubId);
    if (!club) {
      return res
        .status(404)
        .json({ success: false, message: 'Club not found' });
    }

    // Club admin, co-admins, or members holding a named position can post
    const userId = req.user._id.toString();
    const isAdmin    = club.admin.toString() === userId;
    const isCoAdmin  = club.coAdmins.some(id => id.toString() === userId);
    const hasPosition = club.positions.some(p => p.user.toString() === userId);
    if (!isAdmin && !isCoAdmin && !hasPosition) {
      return res.status(403).json({
        success: false,
        message: 'Only club admins or members with a position can post activities',
      });
    }

    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'type, title, and content are required',
      });
    }

    if (type === 'event' && !eventDate) {
      return res.status(400).json({
        success: false,
        message: 'Event date is required for events',
      });
    }

    const activity = await Activity.create({
      club: club._id,
      author: req.user._id,
      type,
      title,
      content,
      eventDate: type === 'event' ? eventDate : undefined,
      eventLocation: type === 'event' ? eventLocation : undefined,
      image: image || '',
      media,
    });

    const populated = await Activity.findById(activity._id)
      .populate('author', 'name avatar')
      .populate('club', 'name');

    const pointAction = type === 'event' ? 'CREATE_EVENT' : 'CREATE_POST';
    const pointsInfo = await awardPoints(req.user._id, pointAction).catch(() => null);

    res.status(201).json({ success: true, activity: populated, pointsInfo });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activities for a specific club
// @route   GET /api/activities/club/:clubId
// @access  Private
exports.getClubActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ club: req.params.clubId })
      .populate('author', 'name avatar')
      .populate('club', 'name')
      .populate('comments.author', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: activities.length, activities });
  } catch (error) {
    next(error);
  }
};

// @desc    Get the user's home feed (activities from joined clubs)
// @route   GET /api/activities/feed
// @access  Private
exports.getFeed = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const activities = await Activity.find({
      club: { $in: user.joinedClubs || [] },
    })
      .populate('author', 'name avatar')
      .populate('club', 'name department')
      .populate('comments.author', 'name')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ success: true, count: activities.length, activities });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an activity (author or club admin only)
// @route   DELETE /api/activities/:id
// @access  Private
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: 'Activity not found' });
    }

    const club = await Club.findById(activity.club);
    const userId = req.user._id.toString();
    const isAuthor    = activity.author.toString() === userId;
    const isClubAdmin = club && club.admin.toString() === userId;
    const hasPosition = club && club.positions.some(p => p.user.toString() === userId);

    if (!isAuthor && !isClubAdmin && !hasPosition) {
      return res
        .status(403)
        .json({ success: false, message: 'Not authorized' });
    }

    await activity.deleteOne();
    res.json({ success: true, message: 'Activity deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a comment to an activity
// @route   POST /api/activities/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
    }

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    activity.comments.push({ author: req.user._id, content: content.trim() });
    await activity.save();

    const pointsInfo = await awardPoints(req.user._id, 'ADD_COMMENT').catch(() => null);

    const updated = await Activity.findById(activity._id).populate('comments.author', 'name');
    const newComment = updated.comments[updated.comments.length - 1];

    res.status(201).json({ success: true, comment: newComment, count: updated.comments.length, pointsInfo });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a comment
// @route   DELETE /api/activities/:id/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ success: false, message: 'Activity not found' });
    }

    const comment = activity.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const userId = req.user._id.toString();
    const isAuthor = comment.author.toString() === userId;
    const club = await Club.findById(activity.club);
    const isClubAdmin = club && club.admin.toString() === userId;
    const hasPosition = club && club.positions.some(p => p.user.toString() === userId);

    if (!isAuthor && !isClubAdmin && !hasPosition) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.deleteOne();
    await activity.save();

    res.json({ success: true, count: activity.comments.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle like on an activity
// @route   POST /api/activities/:id/like
// @access  Private
exports.toggleLike = async (req, res, next) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res
        .status(404)
        .json({ success: false, message: 'Activity not found' });
    }

    const userId = req.user._id.toString();
    const liked = activity.likes.some((id) => id.toString() === userId);

    if (liked) {
      activity.likes = activity.likes.filter((id) => id.toString() !== userId);
    } else {
      activity.likes.push(req.user._id);
      // Award points to the post author for receiving a like
      if (activity.author.toString() !== userId) {
        awardPoints(activity.author, 'RECEIVE_LIKE').catch(() => {});
      }
    }

    await activity.save();
    res.json({ success: true, likes: activity.likes.length, liked: !liked });
  } catch (error) {
    next(error);
  }
};
