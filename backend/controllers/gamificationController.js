const UserStats = require('../models/UserStats');
const User = require('../models/User');
const Activity = require('../models/Activity');
const { checkDailyLogin, getOrCreate } = require('../services/gamificationService');
const { getLevelInfo, BADGES } = require('../services/gamificationConfig');

exports.getMyStats = async (req, res, next) => {
  try {
    const stats = await getOrCreate(req.user._id);
    const { current, next, progress } = getLevelInfo(stats.points);
    res.json({ success: true, stats, level: { current, next, progress } });
  } catch (err) { next(err); }
};

exports.dailyLogin = async (req, res, next) => {
  try {
    const result = await checkDailyLogin(req.user._id);
    const { current, next, progress } = getLevelInfo(result.stats.points);
    res.json({ success: true, ...result, level: { current, next, progress } });
  } catch (err) { next(err); }
};

exports.getLeaderboard = async (req, res, next) => {
  try {
    const { type = 'global', id } = req.query;

    let userIds = null;

    if (type === 'club' && id) {
      const Club = require('../models/Club');
      const club = await Club.findById(id).select('members');
      if (!club) return res.status(404).json({ success: false, message: 'Club not found' });
      userIds = club.members;
    } else if (type === 'department' && id) {
      const users = await User.find({ department: id }).select('_id');
      userIds = users.map(u => u._id);
    }

    const query = userIds ? { user: { $in: userIds } } : {};

    const leaderboard = await UserStats.find(query)
      .sort({ points: -1 })
      .limit(50)
      .populate('user', 'name department avatar');

    const ranked = leaderboard.map((s, i) => ({
      rank: i + 1,
      user: s.user,
      points: s.points,
      level: s.level,
      streak: s.streak,
      badges: s.badges,
    }));

    res.json({ success: true, leaderboard: ranked });
  } catch (err) { next(err); }
};

exports.getAdminAnalytics = async (req, res, next) => {
  try {
    const topUsers = await UserStats.find()
      .sort({ points: -1 })
      .limit(10)
      .populate('user', 'name department avatar');

    const totalUsers = await User.countDocuments();
    const totalActivities = await Activity.countDocuments();
    const Club = require('../models/Club');
    const totalClubs = await Club.countDocuments();

    const topClubs = await Activity.aggregate([
      { $group: { _id: '$club', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: '_id', as: 'club' } },
      { $unwind: '$club' },
      { $project: { name: '$club.name', count: 1, _id: '$club._id' } },
    ]);

    const deptEngagement = await UserStats.aggregate([
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $group: { _id: '$user.department', totalPoints: { $sum: '$points' }, count: { $sum: 1 } } },
      { $sort: { totalPoints: -1 } },
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalActivities, totalClubs },
      topUsers: topUsers.map(s => ({ user: s.user, points: s.points, level: s.level, badges: s.badges.length })),
      topClubs,
      deptEngagement,
    });
  } catch (err) { next(err); }
};

exports.getUserPublicStats = async (req, res, next) => {
  try {
    const stats = await UserStats.findOne({ user: req.params.userId });
    if (!stats) return res.json({ success: true, stats: null });
    const { current, next, progress } = getLevelInfo(stats.points);
    res.json({ success: true, stats, level: { current, next, progress } });
  } catch (err) { next(err); }
};
