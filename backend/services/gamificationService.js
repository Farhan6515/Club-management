const UserStats = require('../models/UserStats');
const { POINTS, BADGES, getLevelInfo } = require('./gamificationConfig');

async function getOrCreate(userId) {
  let stats = await UserStats.findOne({ user: userId });
  if (!stats) stats = await UserStats.create({ user: userId });
  return stats;
}

async function awardPoints(userId, action, extraStats = {}) {
  const pts = POINTS[action];
  if (!pts) return null;

  const stats = await getOrCreate(userId);
  stats.points += pts;
  stats.pointsHistory.push({ action, points: pts });

  // Update sub-counters
  if (action === 'CREATE_POST' || action === 'CREATE_EVENT') stats.stats.postsCreated += 1;
  if (action === 'CREATE_EVENT') stats.stats.eventsCreated += 1;
  if (action === 'ADD_COMMENT')  stats.stats.commentsPosted += 1;
  if (action === 'RECEIVE_LIKE') stats.stats.likesReceived += 1;
  if (action === 'JOIN_CLUB')    stats.stats.clubsJoined += 1;

  // Level update
  const { current } = getLevelInfo(stats.points);
  const leveledUp = stats.level !== current.name;
  stats.level = current.name;

  // Badge checks
  const newBadges = [];
  const has = (b) => stats.badges.includes(b);

  if (!has('top_contributor') && stats.stats.postsCreated >= 10) {
    stats.badges.push('top_contributor'); newBadges.push('top_contributor');
  }
  if (!has('event_master') && stats.stats.eventsCreated >= 5) {
    stats.badges.push('event_master'); newBadges.push('event_master');
  }
  if (!has('comment_king') && stats.stats.commentsPosted >= 50) {
    stats.badges.push('comment_king'); newBadges.push('comment_king');
  }
  if (!has('popular') && stats.stats.likesReceived >= 50) {
    stats.badges.push('popular'); newBadges.push('popular');
  }
  if (!has('social_butterfly') && stats.stats.clubsJoined >= 5) {
    stats.badges.push('social_butterfly'); newBadges.push('social_butterfly');
  }
  if (extraStats.earlyBird && !has('early_bird')) {
    stats.badges.push('early_bird'); newBadges.push('early_bird');
  }

  await stats.save();
  return { stats, leveledUp, newBadges, levelName: current.name };
}

async function checkDailyLogin(userId) {
  const stats = await getOrCreate(userId);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const last = stats.lastLoginDate
    ? new Date(stats.lastLoginDate.getFullYear(), stats.lastLoginDate.getMonth(), stats.lastLoginDate.getDate())
    : null;

  if (last && last.getTime() === today.getTime()) {
    return { alreadyClaimed: true, stats };
  }

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (last && last.getTime() === yesterday.getTime()) {
    stats.streak += 1;
  } else {
    stats.streak = 1;
  }

  if (stats.streak > stats.longestStreak) stats.longestStreak = stats.streak;

  stats.lastLoginDate = now;
  stats.points += POINTS.DAILY_LOGIN;
  stats.pointsHistory.push({ action: 'DAILY_LOGIN', points: POINTS.DAILY_LOGIN });

  const newBadges = [];
  const has = (b) => stats.badges.includes(b);

  let streakBonus = 0;
  if (stats.streak === 7 && !has('streak_hero')) {
    stats.badges.push('streak_hero');
    newBadges.push('streak_hero');
    stats.points += POINTS.STREAK_7;
    streakBonus = POINTS.STREAK_7;
    stats.pointsHistory.push({ action: 'STREAK_7', points: POINTS.STREAK_7 });
  }
  if (stats.streak === 30 && !has('streak_legend')) {
    stats.badges.push('streak_legend');
    newBadges.push('streak_legend');
    stats.points += POINTS.STREAK_30;
    streakBonus = POINTS.STREAK_30;
    stats.pointsHistory.push({ action: 'STREAK_30', points: POINTS.STREAK_30 });
  }

  const { current } = getLevelInfo(stats.points);
  const leveledUp = stats.level !== current.name;
  stats.level = current.name;

  await stats.save();
  return { alreadyClaimed: false, stats, streak: stats.streak, streakBonus, newBadges, leveledUp, levelName: current.name };
}

module.exports = { awardPoints, checkDailyLogin, getOrCreate };
