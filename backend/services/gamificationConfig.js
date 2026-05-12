const POINTS = {
  JOIN_CLUB:    10,
  CREATE_POST:  15,
  CREATE_EVENT: 20,
  ADD_COMMENT:   5,
  RECEIVE_LIKE:  2,
  DAILY_LOGIN:   5,
  STREAK_7:     25,
  STREAK_30:   100,
};

const LEVELS = [
  { name: 'Beginner',       min: 0,    color: 'text-slate-400',  bg: 'bg-slate-400' },
  { name: 'Active Member',  min: 100,  color: 'text-green-400',  bg: 'bg-green-400' },
  { name: 'Pro Member',     min: 300,  color: 'text-blue-400',   bg: 'bg-blue-400'  },
  { name: 'Elite Member',   min: 700,  color: 'text-purple-400', bg: 'bg-purple-400'},
  { name: 'Legend',         min: 1500, color: 'text-amber-400',  bg: 'bg-amber-400' },
];

const BADGES = {
  early_bird:        { label: 'Early Bird',        icon: '🐦', desc: 'Among the first 10 members of a club'  },
  top_contributor:   { label: 'Top Contributor',   icon: '✍️', desc: 'Posted 10+ activities'                 },
  event_master:      { label: 'Event Master',      icon: '🎉', desc: 'Created 5+ events'                     },
  comment_king:      { label: 'Comment King',      icon: '💬', desc: 'Posted 50+ comments'                   },
  streak_hero:       { label: 'Streak Hero',       icon: '🔥', desc: '7-day login streak'                    },
  streak_legend:     { label: 'Streak Legend',     icon: '⚡', desc: '30-day login streak'                   },
  social_butterfly:  { label: 'Social Butterfly',  icon: '🦋', desc: 'Joined 5+ clubs'                       },
  popular:           { label: 'Popular',           icon: '❤️', desc: 'Received 50+ likes'                    },
};

function getLevelInfo(points) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].min) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }
  const progress = next
    ? Math.min(100, Math.round(((points - current.min) / (next.min - current.min)) * 100))
    : 100;
  return { current, next, progress };
}

module.exports = { POINTS, LEVELS, BADGES, getLevelInfo };
