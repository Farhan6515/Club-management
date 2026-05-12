const mongoose = require('mongoose');

const userStatsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    points:        { type: Number, default: 0, min: 0 },
    level:         { type: String, default: 'Beginner' },
    streak:        { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null },
    badges: [{ type: String }],
    stats: {
      postsCreated:    { type: Number, default: 0 },
      eventsCreated:   { type: Number, default: 0 },
      commentsPosted:  { type: Number, default: 0 },
      likesReceived:   { type: Number, default: 0 },
      clubsJoined:     { type: Number, default: 0 },
    },
    pointsHistory: [
      {
        action:    { type: String },
        points:    { type: Number },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserStats', userStatsSchema);
